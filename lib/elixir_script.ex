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
    js_ast = ElixirScript.Translator.translate(quoted)
    {"output.json", js_ast}
  end

  @doc """
  Parses Elixir code files into JavaScript AST
  """
  @spec parse_elixir_files(binary) :: [{binary, ESTree.Node.t}]
  def parse_elixir_files(path) do
    path
    |> Path.wildcard
    |> Enum.map(fn(x) -> parse_elixir_file(x) end)     
  end

  defp parse_elixir_file(path) do
    js_ast = path
    |> File.read!
    |> Code.string_to_quoted!
    |> ElixirScript.Translator.translate

    file_name = Path.basename(path, ".ex") <> ".json"

    {file_name, js_ast}
  end

  @doc """
  Converts JavaScript AST into JavaScript code
  """
  @spec javascript_ast_to_code({binary, ESTree.Node.t}) :: {binary, binary} | {:error, binary}
  def javascript_ast_to_code({ path, js_ast }) do
    case javascript_ast_to_code(js_ast) do
      {:ok, js_code} ->
        { Path.basename(path, ".json") <> ".js", js_code }
      {:error, error} ->
        {:error, error}
    end
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

    path = "#{operating_path}/alphonse.js"

    case System.cmd("node", [path, js_ast]) do
      {js_code, 0} ->
        {:ok, js_code }
      {error, _} ->
        {:error, error}
    end
  end

  @doc """
  Writes output to file
  """
  @spec write_to_files([{binary, binary}], binary) :: nil
  def write_to_files(list, destination) when is_list(list) do
    Enum.each(list, &write_to_files(&1, destination))
  end

  @doc """
  Writes output to file
  """
  @spec write_to_files({binary, binary}, binary) :: :ok | no_return
  def write_to_files({file_name, js}, destination) do
    file_name = Path.join([destination, file_name])

    if !File.exists?(destination) do
      File.mkdir_p!(destination)
    end

    File.write!(file_name, js)
  end


  def operating_path() do
    try do
      Mix.Project.build_path <> "/lib/elixir_script/priv/alphonse"
    rescue
      UndefinedFunctionError ->
        split_path = Path.split(Application.app_dir(:ex2js))
        replaced_path = List.delete_at(split_path, length(split_path) - 1)
        replaced_path = List.delete_at(replaced_path, length(replaced_path) - 1)
        Path.join(replaced_path)
    end
  end

  defmacro js_import(_opts) do
    
  end

  defmacro js_export(_opts) do
    
  end
end
