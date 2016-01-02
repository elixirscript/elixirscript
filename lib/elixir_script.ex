defmodule ElixirScript do
  alias ESTree.Tools.Builder
  alias ESTree.Tools.Generator
  alias ElixirScript.Translator.Utils

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
  * `:stdlib_path` - The es6 import path used to import the elixirscript standard lib.
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

  @external_resource libs_path = Path.join([__DIR__, "elixir_script", "prelude", "**", "*.ex"])
  @libs (for path <- Path.wildcard(libs_path) do
    path
    |> File.read!
    |> Code.string_to_quoted!
  end)

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

    compiler_opts = build_compiler_options(opts)
    ElixirScript.Translator.State.start_link(compiler_opts)

    libs = @libs
    |> updated_quoted

    build_environment(libs ++ [updated_quoted(quoted)])
    create_code(compiler_opts)
  end

  @doc """
  Compiles the elixir files found at the given path
  """
  @spec compile_path(binary, Map.t) :: [binary | {binary, binary}]
  def compile_path(path, opts \\ %{}) do

    compiler_opts = build_compiler_options(opts)
    ElixirScript.Translator.State.start_link(compiler_opts)

    libs = @libs
    |> updated_quoted

    code = path
    |> Path.wildcard
    |> Enum.map(&file_to_quoted/1)

    build_environment(libs ++ code)

    create_code(compiler_opts)
  end

  defp build_compiler_options(opts) do
    default_options = Map.new
    |> Map.put(:include_path, false)
    |> Map.put(:root, nil)
    |> Map.put(:env, custom_env)
    |> Map.put(:import_standard_libs, true)
    |> Map.put(:stdlib_path, "Elixir")

    Map.merge(default_options, opts)
  end

  defp file_to_quoted(file) do
    file
    |> File.read!
    |> Code.string_to_quoted!
    |> updated_quoted
  end

  defp build_environment(code_list) do
    code_list
    |> ElixirScript.Translator.ModuleCollector.process_modules
  end

  defp updated_quoted(quoted) do
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

  def custom_env() do
    __using__([])
    __ENV__
  end

  defp create_code(compiler_opts) do

    state = ElixirScript.Translator.State.get

    standard_lib_modules = state.std_lib_map
    |> Map.values

    result =
      Map.values(state.modules)
      |> Enum.reject(fn(ast) ->
        compiler_opts.import_standard_libs == false && ast.name in standard_lib_modules
      end)
      |> Enum.map(fn ast ->
          env = ElixirScript.Translator.Env.module_env(ast.name,  Utils.name_to_js_file_name(ast.name) <> ".js")

          case ast.type do
            :module ->
              ElixirScript.Translator.Module.make_module(ast.name, ast.body, env)
            :protocol ->
              ElixirScript.Translator.Protocol.consolidate(ast, env)
          end
          |> convert_to_code()
      end)

    ElixirScript.Translator.State.stop

    result
    |> Enum.map(fn({path, code}) ->
      if(compiler_opts.include_path) do
        { path, code }
      else
        code
      end
    end)
  end

  @doc """
  Copies the javascript that makes up the ElixirScript standard libs
  to the specified location
  """
  def copy_standard_libs_to_destination(destination) do
    File.cp!(operating_path <> "/Elixir.js", destination <> "/Elixir.js")
  end

  @doc """
  Returns the standard lib js code
  """
  def standard_libs() do
    File.read!(operating_path <> "/Elixir.js")
  end

  defp convert_to_code(js_ast) do
    process_module(js_ast)
    |> javascript_ast_to_code
  end

  defp process_module(module) do
    file_path = Utils.name_to_js_file_name(module.name) <> ".js"

    { file_path, ESTree.Tools.Builder.program(module.body) }
  end

  @doc false
  def javascript_ast_to_code({path, js_ast}) do
    js_code = javascript_ast_to_code(js_ast)
    {path, js_code}
  end

  @doc false
  def javascript_ast_to_code(js_ast) do
    js_ast
    |> prepare_js_ast
    |> Generator.generate
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
