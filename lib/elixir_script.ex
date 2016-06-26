defmodule ElixirScript do
  alias ESTree.Tools.Builder
  alias ESTree.Tools.Generator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.ModuleCollector
  alias ElixirScript.Compiler.Cache
  alias ElixirScript.Compiler.Output
  require Logger

  @moduledoc """
  Translates Elixir into JavaScript.

  All compile functions return a list of
  transpiled javascript code or a tuple consisting of
  the file name for the code and the transpiled javascript code.

  All compile functions also take an optional opts parameter
  that controls transpiler output.

  Available options are:
  * `:include_path` - a boolean controlling whether to return just the JavaScript code
  or a tuple of the file name and the JavaScript code
  * `:root` - a binary path prepended to the path of the standard lib imports if needed
  * `:env` - a Macro.env struct to use. This is most useful when using macros. Make sure that the
  env has the macros imported or required.
  * `:core_path` - The es6 import path used to import the elixirscript core.
  When using this option, the Elixir.js file is not exported
  * `:full_build` - For compile_path, tells the compiler to perform a full build instead of incremental one
  * `:output` - option to tell compiler how to output data
      * `nil`: Return as list
      * `:stdout`: Write to standard out
      * `path (string)`: Write to specified path
  """

  defmacro __using__(_) do
    quote do
      import Kernel, only: [&&: 2, use: 2, use: 1]
      import ElixirScript.Kernel
      require ElixirScript.JS, as: JS
    end
  end

  # This is the serialized state of the ElixirScript.State module containing references to the standard library
  @external_resource stdlib_state_path = Path.join([__DIR__, "elixir_script", "translator", "stdlib_state.bin"])
  @stdlib_state File.read(stdlib_state_path)
  @lib_path Application.get_env(:elixir_script, :lib_path)
  @version Mix.Project.config[:version]

  @doc """
  Compiles the given Elixir code string
  """
  @spec compile(binary, Map.t) :: [binary | {binary, binary} | :ok]
  def compile(elixir_code, opts \\ %{}) do
    elixir_code
    |> Code.string_to_quoted!
    |> compile_quoted(opts)
  end

  @doc """
  Compiles the given Elixir code in quoted form
  """
  @spec compile_quoted(Macro.t, Map.t) :: [binary | {binary, binary} | :ok]
  def compile_quoted(quoted, opts \\ %{}) do
    { code, _ } = do_compile(opts, [quoted], get_stdlib_state, [])
    Output.out(quoted, code, build_compiler_options(opts))
  end

  @doc """
  Compiles the elixir files found at the given path
  """
  @spec compile_path(binary, Map.t) :: [binary | {binary, binary} | :ok]
  def compile_path(path, opts \\ %{}) do

    {expanded_path, loaded_modules} = case File.dir?(path) do
                                        true ->
                                          process_path(path)
                                        false ->
                                          {[path], []}
                                      end

    opts = build_compiler_options(opts)

    compiler_cache = get_compiler_cache(path, opts)

    new_file_stats = Cache.build_file_stats(expanded_path)

    changed_files = Cache.get_changed_files(compiler_cache.input_files, new_file_stats)
    |> Enum.map(fn {file, state} -> file end)

    code = Enum.map(changed_files, &file_to_quoted/1)

    { code, new_state } = do_compile(opts, code, compiler_cache.state, loaded_modules)
    compiler_cache = %{compiler_cache | input_files: new_file_stats, state: new_state }

    Cache.write(path, compiler_cache)
    Output.out(path, code, opts)
  end

  defp process_path(path) do
    path = Path.join(path, "**/*.{ex,exs,exjs}") |> Path.wildcard
    {exjs, ex} = Enum.partition(path, fn(x) ->
      case Path.extname(x) do
        ext when ext in [".ex", ".exs"] ->
          false
        _ ->
          true
      end
    end)

    ex = Kernel.ParallelRequire.files(ex)
    {exjs, ex}
  end

  defp get_stdlib_state() do
    case @stdlib_state do
      {:ok, data} ->
        data
      {:error, _} ->
        raise RuntimeError, message: "Standard Library state not found. Please run `mix std_lib`"
    end
  end

  defp get_compiler_cache(path, opts) do
    if Map.get(opts, :full_build) or empty?(opts.output) or old_version?(opts) do
      Cache.delete(path)
      Cache.new(get_stdlib_state)
    else
      case Cache.get(path) do
        nil ->
          Cache.new(get_stdlib_state)
        x ->
          %{ x | full_build?: false }
      end
    end
  end

  defp empty?(path) when is_binary(path) do
    case File.ls(path) do
      {:ok, []} ->
        true
      {:error, _} ->
        true
      _ ->
        false
    end
  end

  defp empty?(_) do
    true
  end

  defp old_version?(opts) do
    cache_version = Map.get(opts, :version, nil)
    cache_version == version()
  end

  @doc false
  def version(), do: @version

  @doc false
  def compile_std_lib() do
    compile_std_lib(Path.join([File.cwd!, "priv"]))
  end

  @doc false
  def compile_std_lib(output_path) do
    compiler_opts = build_compiler_options(%{std_lib: true, include_path: true, output: output_path})
    libs_path = Path.join([__DIR__, "elixir_script", "prelude", "**", "*.ex"])

    code = Path.wildcard(libs_path)
    |> Enum.map(&file_to_quoted/1)

    ElixirScript.Translator.State.start_link(compiler_opts, [])

    code
    |> Enum.map(&update_quoted(&1))
    |> ModuleCollector.process_modules

    code = create_code(compiler_opts, ElixirScript.Translator.State.get)
    |> Enum.filter(fn({path, _}) -> !String.contains?(path, "ElixirScript.Temp.js") end)

    new_std_state = ElixirScript.Translator.State.serialize()
    ElixirScript.Translator.State.stop

    File.write!(File.cwd!() <> "/lib/elixir_script/translator/stdlib_state.bin", new_std_state)
    Output.out(libs_path, code, compiler_opts)
  end

  defp do_compile(opts, quoted_code_list, state, loaded_modules) do
    compiler_opts = build_compiler_options(opts)

    ElixirScript.Translator.State.start_link(compiler_opts, loaded_modules)
    ElixirScript.Translator.State.deserialize(state, loaded_modules)

    quoted_code_list
    |> Enum.map(&update_quoted(&1))
    |> ModuleCollector.process_modules

    code = create_code(compiler_opts, ElixirScript.Translator.State.get)
    new_state = ElixirScript.Translator.State.serialize()
    ElixirScript.Translator.State.stop

    { code, new_state }
  end

  defp build_compiler_options(opts) do
    default_options = Map.new
    |> Map.put(:include_path, false)
    |> Map.put(:root, nil)
    |> Map.put(:env, custom_env)
    |> Map.put(:import_standard_libs, true)
    |> Map.put(:core_path, "Elixir")
    |> Map.put(:full_build, false)
    |> Map.put(:output, nil)

    Map.merge(default_options, opts)
  end

  defp file_to_quoted(file) do
    file
    |> File.read!
    |> Code.string_to_quoted!
  end

  defp update_quoted(quoted) do
    Macro.prewalk(quoted, fn
    ({name, context, parms}) ->
      context = if context[:import] == Kernel do
          context = Keyword.update!(context, :import, fn(_) -> ElixirScript.Kernel end)
        else
          context
        end

      {name, context, parms}
    (x) ->
      x
    end)
  end

  @doc false
  def custom_env() do
    __using__([])
    __ENV__
  end

  defp create_code(compiler_opts, state) do

    parent = self

    Map.values(state.modules)
    |> Enum.reject(fn(ast) ->
        not ast.name in state.added_modules
      end)
      |> Enum.map(fn ast ->
      spawn_link fn ->
          env = ElixirScript.Translator.LexicalScope.module_scope(ast.name,  Utils.name_to_js_file_name(ast.name) <> ".js", state.compiler_opts.env)

          module = case ast.type do
            :module ->
                       ElixirScript.Translator.Defmodule.make_module(ast.name, ast.body, env)
            :protocol ->
                       ElixirScript.Translator.Defprotocol.make(ast.name, ast.functions, env)
            :protocol_implementation ->
                       ElixirScript.Translator.Defimpl.make(ast.name, ast.impl_type, ast.body, env)
                   end


          result = javascript_ast_to_code(module)

          send parent, { self, result }
        end
      end)
      |> Enum.map(fn pid ->
        receive do
          {^pid, result} -> result
        end
    end)
  end

  @doc false
  def update_protocols(compiler_output, compiler_opts) do
    Enum.reduce(compiler_output, %{}, fn
      {file, code}, state ->
        case String.split(file, ".DefImpl.") do
          [protocol, impl] ->
            protocol = String.split(protocol, "/") |> List.last |> String.to_atom
            impl = String.replace(impl, ".js", "") |> String.to_atom
            Map.put(state, protocol, Map.get(state, protocol, []) ++ [impl])
          [_] ->
            state
        end
      _, state ->
        state
    end)
    |> do_make_defimpl(compiler_opts)
  end

  @doc false
  def update_protocols_in_path(compiler_output, compiler_opts, output_path) do
    Enum.reduce(compiler_output, %{}, fn {file, code}, state ->
      case String.split(file, ".DefImpl.") do
        [protocol, _] ->
          protocol = String.split(protocol, "/") |> List.last
          protocol_impls = find_protocols_implementations_in_path(output_path, protocol)
          protocol = String.to_atom(protocol)
          Map.put(state, protocol, Map.get(state, protocol, []) ++ protocol_impls)
        [_] ->
          state
      end
    end)
    |> do_make_defimpl(compiler_opts)
  end

  defp do_make_defimpl(protocols, compiler_opts) do
    Enum.map(protocols, fn {protocol, implementations} ->
      ElixirScript.Translator.Defprotocol.make_defimpl(protocol, Enum.uniq(implementations), compiler_opts)
    end)
    |> Enum.map(fn(module) ->
      javascript_ast_to_code(module)
    end)
  end

  defp find_protocols_implementations_in_path(path, protocol_prefix) do
    Path.join([path, protocol_prefix <> ".DefImpl*.js"])
    |> Path.wildcard
    |> Enum.filter(fn path -> !String.ends_with?(path, "DefImpl.js") end)
    |> Enum.map(fn impl ->
      Path.basename(impl)
      |> String.split(".DefImpl.")
      |> List.last
      |> String.replace(".js", "")
      |> String.to_atom end)
  end

  @doc """
  Copies the javascript that makes up the ElixirScript stdlib
  to the specified location
  """
  def copy_stdlib_to_destination(destination) do
    Enum.each(Path.wildcard(Path.join([operating_path, "*.js"])), fn(path) ->
      base = Path.basename(path)
      File.cp!(path, Path.join([destination, base]))
    end)
  end

  defp javascript_ast_to_code(module) do
    path = Utils.name_to_js_file_name(module.name) <> ".js"
    js_ast = Builder.program(module.body)

    js_code = js_ast
    |> prepare_js_ast
    |> Generator.generate

    { path, js_code }
  end

  defp prepare_js_ast(js_ast) do
    js_ast = case js_ast do
               modules when is_list(modules) ->
                 modules
                 |> Enum.reduce([], &(&2 ++ &1.body))
                 |> Builder.program
               %ElixirScript.Translator.Group{ body: body } ->
                 Builder.program(body)
               %ElixirScript.Translator.Empty{ } ->
                 Builder.program([])
               _ ->
                 js_ast
             end

    js_ast
  end

  #Gets path to js files whether the mix project is available
  #or when used as an escript
  defp operating_path do
    case @lib_path do
      nil ->
        try do
          Mix.Project.build_path <> "/lib/elixir_script/priv"
        rescue
          UndefinedFunctionError ->
            split_path = Path.split(Application.app_dir(:elixirscript))
          replaced_path = List.delete_at(split_path, length(split_path) - 1)
          replaced_path = List.delete_at(replaced_path, length(replaced_path) - 1)
          Path.join(replaced_path)
        end
      lib_path ->
        lib_path
    end
  end

end
