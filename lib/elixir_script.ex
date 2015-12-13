defmodule ElixirScript do
  alias ElixirScript.Translator.JSModule
  alias ESTree.Tools.Builder
  alias ESTree.Tools.Generator

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

  @external_resource libs_path = Path.join([__DIR__, "elixir_script", "universal", "**", "*.ex"])
  @libs (for path <- Path.wildcard(libs_path) do
    path
    |> File.read!
    |> Code.string_to_quoted!
  end)

  @doc """
  Compiles the given Elixir code string
  """
  @spec compile(binary, Dict.t) :: [binary | {binary, binary}]
  def compile(elixir_code, opts \\ []) do
    elixir_code
    |> Code.string_to_quoted!
    |> compile_quoted(opts)
  end

  @doc """
  Compiles the given Elixir code in quoted form
  """
  @spec compile_quoted(Macro.t, Dict.t) :: [binary | {binary, binary}]
  def compile_quoted(quoted, opts \\ []) do
    include_path = Dict.get(opts, :include_path, false)
    root = Dict.get(opts, :root)
    env = Dict.get(opts, :env, custom_env)
    import_standard_libs? = Dict.get(opts, :import_standard_libs, true)
    stdlib_path = Dict.get(opts, :stdlib_path, "Elixir")

    ElixirScript.State.start_link(root, env)

    libs = @libs
    |> updated_quoted

    build_environment(libs ++ [updated_quoted(quoted)])
    create_code(include_path, import_standard_libs?, stdlib_path)
  end

  @doc """
  Compiles the elixir files found at the given path
  """
  @spec compile_path(binary, Dict.t) :: [binary | {binary, binary}]
  def compile_path(path, opts \\ []) do
    include_path = Dict.get(opts, :include_path, false)
    root = Dict.get(opts, :root)
    env = Dict.get(opts, :env, custom_env)
    stdlib_path = Dict.get(opts, :stdlib_path, "Elixir")

    ElixirScript.State.start_link(root, env)

    libs = @libs
    |> updated_quoted

    code = path
    |> Path.wildcard
    |> Enum.map(&file_to_quoted/1)

    build_environment(libs ++ code)

    create_code(include_path, true, stdlib_path)
  end

  defp file_to_quoted(file) do
    file
    |> File.read!
    |> Code.string_to_quoted!
    |> updated_quoted
  end

  defp build_environment(code_list) do
    code_list
    |> ElixirScript.Preprocess.Modules.get_info
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

  defp create_code(include_path, import_standard_libs?, stdlib_path) do

    ElixirScript.State.process_imports

    state = ElixirScript.State.get

    parent = self

    result =
      Map.values(state.modules)
      |> Enum.map(fn ast ->
        spawn_link fn ->
          Process.put(:current_module, ast.name)

          result = case ast.type do
            :module ->
              ElixirScript.Translator.Module.make_module(ast.name, ast.body, state.env)
              |> Enum.map(&(convert_to_code(&1, state.root, state.env, import_standard_libs?, stdlib_path)))
            :protocol ->
              ElixirScript.Translator.Protocol.consolidate([ast], state.env)
              |> Enum.map(&(convert_to_code(&1, state.root, state.env, import_standard_libs?, stdlib_path)))
          end

          send parent, { self, result }
        end
      end)
      |> Enum.map(fn pid ->
        receive do
          { ^pid, x } -> x
        end
      end)
      |> List.flatten

    ElixirScript.State.stop

    result
    |> Enum.sort(fn({name1, _, _}, {name2, _, _}) ->
      Atom.to_string(name1) < Atom.to_string(name2)
    end)
    |> Enum.reject(fn({name, _, _}) ->
      import_standard_libs? == false && name in [
        ElixirScript.Kernel, ElixirScript.Tuple, ElixirScript.Collectable,
        ElixirScript.Atom, ElixirScript.String.Chars, ElixirScript.Enumerable,
        ElixirScript.Integer
      ]
    end)
    |> Enum.map(fn({_, path, code}) ->
      if(include_path) do
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

  defp convert_to_code(js_ast, root, env, import_standard_libs, stdlib_path) do
    js_ast
    |> process_module(root, env, import_standard_libs, stdlib_path)
    |> javascript_ast_to_code
  end

  defp process_module(%JSModule{} = module, root, _, import_standard_libs, stdlib_path) do
    file_path = create_file_name(module)

    standard_libs_import =
      if import_standard_libs do
        ElixirScript.Translator.Import.create_standard_lib_imports(root, stdlib_path)
      else
        []
      end

    program =
      standard_libs_import ++ module.body
      |> ESTree.Tools.Builder.program

    {module.name, file_path, program}
  end

  defp create_file_name(%JSModule{name: module}) do
    name = ElixirScript.Module.name_to_js_file_name(module)
    "#{name}.js"
  end

  @doc false
  def javascript_ast_to_code({name, path, js_ast}) do
    js_code = javascript_ast_to_code(js_ast)
    {name, path, js_code}
  end

  @doc false
  def javascript_ast_to_code(js_ast) do
    js_ast
    |> prepare_js_ast
    |> Generator.generate
  end

  defp prepare_js_ast(js_ast) do
    case js_ast do
      modules when is_list(modules) ->
        modules
        |> Enum.reduce([], &(&2 ++ &1.body))
        |> Builder.program
      %ElixirScript.Translator.Group{body: body} ->
        Builder.program(body)
      _ ->
        js_ast
    end
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
