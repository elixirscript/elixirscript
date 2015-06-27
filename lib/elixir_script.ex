defmodule ElixirScript do

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
    |> Enum.map(fn(x) -> File.read!(x) end)
    |> Enum.join("\n")
    |> Code.string_to_quoted!
    |> ElixirScript.Translator.translate    
  end

  @doc """
  Converts JavaScript AST into JavaScript code
  """
  @spec javascript_ast_to_code(ESTree.Node.t) :: {:ok, binary} | {:error, binary}
  def javascript_ast_to_code(js_ast) do
    js_ast = case js_ast do
      %ElixirScript.Translator.Group{body: body} ->
        ESTree.Builder.program(body)
      _ ->
        js_ast
    end

    js_ast = Poison.encode!(js_ast)

    path = "#{operating_path}/code_generator.js"

    case System.cmd("node", [path, js_ast]) do
      {js_code, 0} ->
        {:ok, js_code }
      {error, _} ->
        {:error, error}
    end
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

  @doc """
  Writes output to file
  """
  def write_to_file(js_code, destination) do
    file_name = Path.join([destination, "#{app_name()}.js"])

    if !File.exists?(destination) do
      File.mkdir_p!(destination)
    end

    File.write!(file_name, js_code)
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

  def post_process_js_ast(js_ast) do
    ESTree.Builder.program(
      ElixirScript.PostProcessor.create_import_statements() ++
      List.wrap(ElixirScript.PostProcessor.create_root_object()) ++
      List.wrap(js_ast) ++
      List.wrap(ElixirScript.PostProcessor.export_root_object())
    )
  end

  def load_config() do
    load_config("exjs.exs")
  end

  def load_config(path) do
    modules = Code.load_file(path)

    Enum.each(modules, fn({ module, _ }) -> 
      case module do
        ElixirScript.Config ->
          config = module.project()
          Application.put_env(:elixir_script, :app, config[:app])
          Application.put_env(:elixir_script, :js_deps, config[:js_deps])
      end
    end)
  end

  def capitalize_app_name() do
    Atom.to_string(app_name())
    |> String.capitalize
    |> String.to_atom
  end

  def app_name() do
    Application.get_env(:elixir_script, :app)
  end
end
