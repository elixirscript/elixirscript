defmodule ElixirScript do
  require Logger

  defmodule ParseError do
     defexception message: "Erroro while parsing SpiderMonkey JST"
  end

  def parse(ast) do
    ElixirScript.Parser.parse(ast)
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
    |> ElixirScript.SpiderMonkey.parse
    |> Poison.encode!

    case System.cmd(System.cwd() <> "/escodegen", [js_ast]) do

      {js_code, 0} ->
        ex_file_name = Path.basename(path)
        js_file_name = String.replace(ex_file_name, ".ex", ".js")

        { Path.dirname(path), js_file_name, js_code }
      {error, _} ->
        raise ParseError, message: error
    end


  end

  def write_js_files(list) do
    Enum.each(list, fn(x) -> write_js_file(x) end)
  end

  def write_js_file({path, file_name, js}) do
    file_name = Path.join([path, file_name])

    File.write!(file_name, js)
  end
end
