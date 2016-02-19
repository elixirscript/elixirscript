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


  # At compile time, gathers the files containing the standard lib modules,
  # converts them to their quoted forms and keeps them in @libs for use when compiling.

  # These are full of macros and would not transpile to anything significant
  @modules_to_not_read ["v_dom.ex", "html.ex"]

  @external_resource libs_path = Path.join([__DIR__, "elixir_script", "prelude", "**", "*.ex"])
  @libs Enum.filter(Path.wildcard(libs_path), fn(path) ->
   !String.contains?(path, @modules_to_not_read)
  end)
  |> Enum.map(fn(path) ->
      path
      |> File.read!
      |> Code.string_to_quoted!
    end)

  @js_core_path "/Elixir.js"

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

  defp do_compile(opts, quoted_code_list) do
    compiler_opts = build_compiler_options(opts)
    libs = update_quoted(@libs)

    ElixirScript.Translator.State.start_link(compiler_opts)

    ModuleCollector.process_modules(libs ++ Enum.map(quoted_code_list, &update_quoted(&1)))

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

    standard_lib_modules = Map.values(state.std_lib_map)

    result =
      Map.values(state.modules)
      |> Enum.reject(fn(ast) ->
        compiler_opts.import_standard_libs == false && ast.name in standard_lib_modules
      end)
      |> Enum.map(fn ast ->
      spawn_link fn ->
          env = ElixirScript.Translator.Env.module_env(ast.name,  Utils.name_to_js_file_name(ast.name) <> ".js")

          module = case ast.type do
            :module ->
              ElixirScript.Translator.Module.make_module(ast.name, ast.body, env)
            :protocol ->
              ElixirScript.Translator.Protocol.consolidate(ast, env)
          end

          { path, code } = convert_to_code(module)

          result = case compiler_opts.include_path do
            true ->
              { path, code }
            false ->
              code
          end

          send parent, { self, result }
        end
      end)
      |> Enum.map(fn pid ->
        receive do
          {^pid, result} -> result
        end
      end)

    result
  end

  @doc """
  Copies the javascript that makes up the ElixirScript core
  to the specified location
  """
  def copy_core_to_destination(destination) do
    File.cp!(operating_path <> @js_core_path, destination <> @js_core_path)
  end

  @doc """
  Returns the elixirscript core js code
  """
  def elixirscript_core() do
    File.read!(operating_path <> @js_core_path)
  end

  defp convert_to_code(js_ast) do
    process_module(js_ast)
    |> javascript_ast_to_code
  end

  defp process_module(module) do
    file_path = Utils.name_to_js_file_name(module.name) <> ".js"

    { file_path, Builder.program(module.body) }
  end

  defp javascript_ast_to_code({path, js_ast}) do
    js_code = js_ast
    |> prepare_js_ast
    |> Generator.generate

    {path, js_code}
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
