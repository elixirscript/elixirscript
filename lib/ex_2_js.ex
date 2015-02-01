defmodule ExToJS do
  require Logger

  defmodule ParseError do
     defexception message: "Erroro while parsing SpiderMonkey JST"
  end

  def parse(ast) do
    ExToJS.Parser.parse(ast)
  end

  def parse_elixir(ex_code) do
    js_ast = ex_code
    |> Code.string_to_quoted!
    |> ExToJS.SpiderMonkey.parse
    |> Poison.encode!

    [{ js_ast, "output.json" }]
  end

  def parse_ex_files(path) do
    path
    |> Path.wildcard
    |> Enum.map(fn(x) -> parse_ex_file(x) end)     
  end

  def parse_ex_file(path) do
    js_ast = path
    |> File.read!
    |> Code.string_to_quoted!
    |> ExToJS.SpiderMonkey.parse
    |> Poison.encode!

    { js_ast, Path.basename(path, ".ex") <> ".json" }
  end

  def convert_ast_to_js(js_ast) when is_list(js_ast) do
    Enum.map(js_ast, &convert_ast_to_js(&1))
  end

  def convert_ast_to_js({ js_ast, path }) do
    case System.cmd(System.cwd() <> "/escodegen", [js_ast]) do
      {js_code, 0} ->
        { js_code, Path.basename(path, ".json") <> ".js" }
      {error, _} ->
        raise ParseError, message: error
    end
  end

  def write_to_files(list, destination) do
    Enum.each(list, fn(x) -> write_to_file(x, destination) end)
  end

  def write_to_file({js, file_name}, destination) do
    file_name = Path.join([destination, file_name])

    if !File.exists?(destination) do
      File.mkdir_p!(destination)
    end

    File.write!(file_name, js)
  end
end
