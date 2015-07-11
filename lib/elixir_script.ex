defmodule ElixirScript do
  alias ElixirScript.Translator.JSModule
  alias ESTree.Tools.Builder
  alias ESTree.Tools.Generator

  @doc """
  Parses Elixir code string into JavaScript AST
  """
  @spec parse_elixir(binary) :: {binary, ESTree.Node.t}
  def parse_elixir(elixir_code) do
    elixir_code
    |> Code.string_to_quoted!
    |> parse_quoted
  end

  @doc """
  Parses Elixir code in it's quoted form into JavaScript AST
  """
  @spec parse_quoted(Macro.t) :: {binary, ESTree.Node.t}
  def parse_quoted(quoted) do
    ElixirScript.Translator.translate(quoted)
  end

  @doc """
  Parses Elixir code files into JavaScript AST
  """
  @spec parse_elixir_files(binary) :: [{binary, ESTree.Node.t}]
  def parse_elixir_files(path) do
    path
    |> Path.wildcard
    |> Enum.map(fn(x) ->
      File.read!(x)
      |> Code.string_to_quoted!
      |>  ElixirScript.Translator.translate
    end)
    |> List.flatten
  end

  def process_module(module, root) do
    file_path = create_file_name(module)

    program = ElixirScript.Translator.Module.create_standard_lib_imports(module.stdlibs, root) ++ module.body
    |> ESTree.Tools.Builder.program
    
   { file_path, program }
  end

  defp create_file_name(%ElixirScript.Translator.JSModule{ name: module_list }) do
    "#{ElixirScript.Translator.Import.make_file_path(module_list)}.js"
  end

  @doc """
  Converts JavaScript AST into JavaScript code
  """
  @spec javascript_ast_to_code(ESTree.Node.t) :: {:ok, binary} | {:error, binary}
  def javascript_ast_to_code(js_ast) do
    js_ast = prepare_js_ast(js_ast) 
    {:ok, Generator.generate(js_ast) }
  end

  @doc """
  Same as javascript_ast_to_code but throws an error
  """
  @spec javascript_ast_to_code!(ESTree.Node.t) :: binary
  def javascript_ast_to_code!(js_ast) do
    case javascript_ast_to_code(js_ast) do
      {:ok, js_code } ->
        js_code
      {:error, error } ->
        raise ElixirScript.ParseError, message: error
    end
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

  @doc """
  Writes output to file
  """
  def write_to_file({ file_path, js_code }, destination) do
    file_name = Path.join([destination, file_path])

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, js_code)
  end

  def copy_standard_libs_to_destination(destination) do
    File.cp_r!(operating_path <> "/lib", destination <> "/__lib")
  end

  def operating_path() do
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

  def post_process_js_ast(modules, root) when is_list(modules) do
    Enum.map(modules, &process_module(&1, root))
  end

  def post_process_js_ast(js_ast) do
    js_ast
  end
  

end
