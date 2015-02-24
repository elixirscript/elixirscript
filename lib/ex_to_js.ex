defmodule ExToJS do

  def parse_elixir(ex_code) do
    js_ast = parse(ex_code)
    [{ js_ast, "output.json" }]
  end

  def parse_ex_files(path) do
    path
    |> Path.wildcard
    |> Enum.map(fn(x) -> parse_ex_file(x) end)     
  end

  def parse_ex_file(path) do
    ex_code = File.read!(path)
    js_ast = parse(ex_code)

    { js_ast, Path.basename(path, ".ex") <> ".json" }
  end

  def parse(ex_code) do
    ex_ast = Code.string_to_quoted!(ex_code)
    sm_ast = ExToJS.Translator.translate(ex_ast)

    if !is_list(sm_ast) do
      sm_ast = [sm_ast]
    end

    sm_ast = SpiderMonkey.Builder.program(sm_ast)

    Poison.encode!(sm_ast)
  end

  def convert_ast_to_js(js_ast) when is_list(js_ast) do
    Enum.map(js_ast, &convert_ast_to_js(&1))
  end

  def convert_ast_to_js({ js_ast, path }) do
    case ExToJS.Translator.js_ast_to_js(js_ast) do
      {:ok, js_code} ->
        { js_code, Path.basename(path, ".json") <> ".js" }
      {:error, error} ->
        raise ExToJS.ParseError, message: error
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
