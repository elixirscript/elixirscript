defmodule ElixirScript do
  alias ElixirScript.Translator
  alias ElixirScript.Translator.JSModule
  alias ESTree.Tools.Builder
  alias ESTree.Tools.Generator
  require Logger

  @moduledoc """
  Transpiles Elixir into JavaScript.

  All transpile functions return a list of
  transpiled javascript code or a tuple consisting of
  the file name for the code and the transpiled javascript code.

  All transpile functions also take an optional opts parameter
  that controls transpiler output.

  Available options are:
  * `:include_path` - a boolean controlling whether to return just the JavaScript code
  or a tuple of the file name and the JavaScript code

  * `:root` - a binary path prepended to the path of the standard lib imports if needed
  * `:env` - a Macro.env struct to use. This is most useful when using macros. Make sure that the
  given env has the macros required. Defaults to __ENV__.
  """

  @doc """
  Transpiles the given Elixir code string
  """
  @spec transpile(binary, Dict.t) :: [binary | { binary, binary }]
  def transpile(elixir_code, opts \\ []) do
    elixir_code
    |> Code.string_to_quoted!
    |> transpile_quoted(opts)
  end

  @doc """
  Transpiles the given Elixir code in quoted form
  """
  @spec transpile_quoted(Macro.t, Dict.t) :: [binary | { binary, binary }]
  def transpile_quoted(quoted, opts \\ []) do
    include_path = Dict.get(opts, :include_path, false)
    root = Dict.get(opts, :root)
    env = Dict.get(opts, :env, __ENV__)

    case Translator.translate(quoted, env) do
      modules when is_list(modules) ->
        List.flatten(modules)
        |> Enum.map(fn(x) ->
          convert_to_code(x, root, include_path)
        end)
      module ->
        List.wrap(
          convert_to_code(module, root, include_path)
        )
    end
  end

  @doc """
  Transpiles the elixir files found at the given path
  """
  @spec transpile_path(binary, Dict.t) :: [binary | { binary, binary }]
  def transpile_path(path, opts \\ []) do
    include_path = Dict.get(opts, :include_path, false)
    root = Dict.get(opts, :root)
    env = Dict.get(opts, :env, __ENV__)

    path
    |> Path.wildcard
    |> Enum.map(fn(x) -> 
      File.read!(x)
      |> Code.string_to_quoted!
      |> Translator.translate(env)
    end)
    |> List.flatten
    |> Enum.map(fn(x) ->
      convert_to_code(x, root, include_path)
    end)
  end

  @doc """
  Copies the javascript that makes up the ElixirScript standard libs
  to the specified location
  """
  def copy_standard_libs_to_destination(destination) do
    File.cp_r!(operating_path <> "/dist", destination)
  end

  defp convert_to_code(js_ast, root, include_path) do
      js_ast
      |> process_module(root)
      |> javascript_ast_to_code
      |> process_include_path(include_path)
  end

  defp process_module(%JSModule{} = module, root) do
    file_path = create_file_name(module)

    program = create_standard_lib_imports(root) ++ module.body
    |> ESTree.Tools.Builder.program

    { file_path, program }
  end

  defp process_module(module, _root) do
    { "", module }
  end

  defp create_standard_lib_imports(root) do
    module_name_list = [:Elixir]
    options = [
      from: root(root) <> "elixir", 
      only: [
        fun: 1, virtualDom: 1, 
        Erlang: 1, Kernel: 1, Atom: 1, Enum: 1, Integer: 1, 
        JS: 1, List: 1, Range: 1, Tuple: 1, Agent: 1, Keyword: 1
      ]
    ]

    [ElixirScript.Translator.Import.make_import(module_name_list, options)]
  end

  defp root(nil) do
    ""
  end

  defp root(root) do
    root <> "/"
  end

  defp create_file_name(%JSModule{ name: module_list }) do
    name = ElixirScript.Translator.Import.make_file_path(module_list)
    "#{name}.js"
  end

  defp process_include_path({ _, _ } = pair, true) do
    pair
  end

  defp process_include_path({ _, code }, false) do
    code
  end

  @doc false
  def javascript_ast_to_code({ path, js_ast }) do
    js_code = javascript_ast_to_code(js_ast)
    { path, js_code }
  end

  @doc false
  def javascript_ast_to_code(js_ast) do
    prepare_js_ast(js_ast)
    |> Generator.generate
  end

  defp prepare_js_ast(js_ast) do
    case js_ast do
      modules when is_list(modules) ->
        Enum.reduce(modules, [], fn(x, list) -> list ++ x.body end)
        |> Builder.program
      %ElixirScript.Translator.Group{body: body} ->
        Builder.program(body)      
      _ ->
        js_ast
    end
  end

  defp operating_path() do
    try do
      Mix.Project.build_path <> "/lib/elixir_script/priv/javascript"
    rescue
      UndefinedFunctionError ->
        split_path = Path.split(Application.app_dir(:ex2js))
        replaced_path = List.delete_at(split_path, length(split_path) - 1)
        replaced_path = List.delete_at(replaced_path, length(replaced_path) - 1)
        Path.join(replaced_path)
    end
  end
  

end
