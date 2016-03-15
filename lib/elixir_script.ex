defmodule ElixirScript do
  alias ESTree.Tools.Builder
  alias ESTree.Tools.Generator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.ModuleCollector

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
  * `:core_path` - The es6 import path used to import the elixirscript core.
  When using this option, the Elixir.js file is not exported
  """

  defmacro __using__(_) do
    quote do
      import Kernel, only: [&&: 2, use: 2, use: 1]
      import ElixirScript.Kernel
      require ElixirScript.JS, as: JS
      require ElixirScript.Html, as: Html
      require ElixirScript.VDom, as: VDom
    end
  end

  @external_resource stdlib_state_path = Path.join([__DIR__, "elixir_script", "translator", "stdlib_state.exs"])
  @stdlib_state File.read!(stdlib_state_path)

  @js_core_path "/*.js"

  @doc """
  Compiles the given Elixir code string
  """
  @spec compile(binary, Map.t) :: [binary | {binary, binary}]
  def compile(elixir_code, opts \\ %{}) do
    elixir_code
    |> Code.string_to_quoted!
    |> compile_quoted(opts)
  end

  @doc """
  Compiles the given Elixir code in quoted form
  """
  @spec compile_quoted(Macro.t, Map.t) :: [binary | {binary, binary}]
  def compile_quoted(quoted, opts \\ %{}) do
    do_compile(opts, [quoted])
  end

  @doc """
  Compiles the elixir files found at the given path
  """
  @spec compile_path(binary, Map.t) :: [binary | {binary, binary}]
  def compile_path(path, opts \\ %{}) do
    path = Path.wildcard(path)
    code = Enum.map(path, &file_to_quoted/1)

    do_compile(opts, code)
  end

  def compile_std_lib() do
    compiler_opts = build_compiler_options(%{std_lib: true, include_path: true})
    libs_path = Path.join([__DIR__, "elixir_script", "prelude", "**", "*.ex"])
    code = Path.wildcard(libs_path)
    |> Enum.filter(fn(path) ->
      !String.contains?(path, ["v_dom.ex", "html.ex"])
    end)
    |> Enum.map(&file_to_quoted/1)

    ElixirScript.Translator.State.start_link(compiler_opts)
    ModuleCollector.process_modules(Enum.map(code, &update_quoted(&1)))
    code = create_code(compiler_opts)
    new_std_state = ElixirScript.Translator.State.serialize()
    ElixirScript.Translator.State.stop

    File.write!(File.cwd!() <> "/lib/elixir_script/translator/stdlib_state.exs", new_std_state)

    output_path = File.cwd!() <> "/priv"

    Enum.filter(code, fn({path, _}) -> !String.contains?(path, "ElixirScript.Temp.js") end)
    |> Enum.each(fn(x) ->
      ElixirScript.CLI.write_to_file(x, output_path)
    end)
  end

  defp do_compile(opts, quoted_code_list) do
    compiler_opts = build_compiler_options(opts)
    ElixirScript.Translator.State.start_link(compiler_opts)
    ElixirScript.Translator.State.deserialize(@stdlib_state)

    ModuleCollector.process_modules(Enum.map(quoted_code_list, &update_quoted(&1)))
    code = create_code(compiler_opts)
    ElixirScript.Translator.State.stop

    code
  end

  defp build_compiler_options(opts) do
    default_options = Map.new
    |> Map.put(:include_path, false)
    |> Map.put(:root, nil)
    |> Map.put(:env, custom_env)
    |> Map.put(:import_standard_libs, true)
    |> Map.put(:core_path, "Elixir")

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
      if context[:import] == Kernel do
        context = Keyword.update!(context, :import, fn(_) -> ElixirScript.Kernel end)
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

  defp create_code(compiler_opts) do

    parent = self

    state = ElixirScript.Translator.State.get

    standard_lib_modules = Map.values(state.std_lib_map) |> Enum.map(&to_string(&1)) |> Enum.map(&String.replace(&1, "Elixir.", ""))

    result =
      Map.values(state.modules)
    |> Enum.reject(fn(ast) ->
      name = Atom.to_string(ast.name) |> String.replace("Elixir.", "")
        cond do
          Map.get(compiler_opts, :std_lib, false) == false and name in standard_lib_modules ->
            true
          Map.get(compiler_opts, :std_lib, false) == false and ast.type == :protocol_implementation and String.starts_with?(name, standard_lib_modules) ->
            true
          true ->
            false
        end
      end)
      |> Enum.map(fn ast ->
      spawn_link fn ->
          env = ElixirScript.Translator.Env.module_env(ast.name,  Utils.name_to_js_file_name(ast.name) <> ".js")

          module = case ast.type do
            :module ->
                       ElixirScript.Translator.Module.make_module(ast.name, ast.body, env)
            :protocol ->
                       ElixirScript.Translator.Protocol.make(ast.name, ast.functions, env)
            :protocol_implementation ->
                       ElixirScript.Translator.Protocol.Implementation.make(ast.name, ast.impl_type, ast.body, env)
                   end


          result = convert_to_code(module)

          send parent, { self, result }
        end
      end)
      |> Enum.map(fn pid ->
        receive do
          {^pid, result} -> result
        end
    end)

      { result, protocols } = Enum.map_reduce(result, %{}, fn
        { path, code, nil, _ }, protocols ->
          {{ path, code}, protocols }
        { path, code, protocol, name }, protocols ->
          {{ path, code}, Map.put(protocols, protocol, Map.get(protocols, protocol, []) ++ [name]) }
      end)

    defimpls = Enum.map(protocols, fn({protocol, implementations}) ->
      ElixirScript.Translator.Protocol.make_defimpl(protocol, implementations, state.compiler_opts)
    end)
    |> Enum.map(fn(module) ->
      { path, code, _, _ } = convert_to_code(module)
      {path, code}
    end)

    result = result ++ defimpls

      result = Enum.map(result, fn
        { path, code } ->
          case compiler_opts.include_path do
            true ->
              { path, code }
            false ->
              code
          end
    end)

    result
  end

  def update_protocols(path, compiler_opts) do
    result = Enum.filter(Path.wildcard(path), fn(js_file_path) ->
      String.contains?(js_file_path, ".DefImpl")
    end)
    |> Enum.reduce(%{}, fn(js_file_path, state) ->
      case String.split(js_file_path, ".DefImpl.") do
        [protocol, "js"] ->
          protocol = String.split(protocol, "/") |> List.last |> String.to_atom
          Map.put(state, protocol, Map.get(state, protocol, []))
        [protocol, impl] ->
          protocol = String.split(protocol, "/") |> List.last |> String.to_atom
          impl = String.replace(impl, ".js", "") |> String.to_atom
          Map.put(state, protocol, Map.get(state, protocol, []) ++ [impl])
      end
    end)
    |> Enum.map(fn {protocol, implementations} ->
      ElixirScript.Translator.Protocol.make_defimpl(protocol, implementations, compiler_opts)
    end)
    |> Enum.map(fn(module) ->
      { path, code, _, _ } = convert_to_code(module)
      {path, code}
    end)

  end

  @doc """
  Copies the javascript that makes up the ElixirScript core
  to the specified location
  """
  def copy_core_to_destination(destination) do
    Enum.each(Path.wildcard(operating_path <> @js_core_path), fn(path) ->
      base = Path.basename(path)
      File.cp!(path, Path.join([destination, base]))
    end)
  end

  @doc """
  Returns the elixirscript core js code
  """
  def elixirscript_core() do
    Enum.each(Path.wildcard(operating_path <> @js_core_path), fn(path) ->
      File.read!(path)
    end)
  end

  defp convert_to_code(js_ast) do
    process_module(js_ast)
    |> javascript_ast_to_code
  end

  defp process_module(module) do
    file_path = Utils.name_to_js_file_name(module.name) <> ".js"

    { file_path, Builder.program(module.body), Map.get(module, :protocol), Map.get(module, :name) }
  end

  defp javascript_ast_to_code({path, js_ast, protocol, name}) do
    js_code = js_ast
    |> prepare_js_ast
    |> Generator.generate

    {path, js_code, protocol, name}
  end

  defp prepare_js_ast(js_ast) do
    js_ast = case js_ast do
      modules when is_list(modules) ->
        modules
        |> Enum.reduce([], &(&2 ++ &1.body))
        |> Builder.program
      %ElixirScript.Translator.Group{ body: body } ->
        Builder.program(body)
      _ ->
        js_ast
    end

    js_ast
  end

  defp operating_path do
    try do
      Mix.Project.build_path <> "/lib/elixir_script/priv"
    rescue
      UndefinedFunctionError ->
        split_path = Path.split(Application.app_dir(:elixirscript))
        replaced_path = List.delete_at(split_path, length(split_path) - 1)
        replaced_path = List.delete_at(replaced_path, length(replaced_path) - 1)
        Path.join(replaced_path)
    end
  end
end
