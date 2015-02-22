ExUnit.start()

defmodule ExToJS.TestHelper do
  def ex_ast_to_js(ex_ast, wrapInProgram \\ false) do

    js_ast = ExToJS.Parser.parse(ex_ast)

    if wrapInProgram do
      js_ast = SpiderMonkey.Builder.program(js_ast)
    end

    js_json = SpiderMonkey.Builder.to_json(js_ast)

    result = ExToJS.Parser.js_ast_to_js(js_json)

    case result do
      {:ok, js_code} ->
        js_code
      {:error, error} ->
        raise ExToJS.ParseError, message: error
    end
  end

  def strip_spaces(js) do
    js |> strip_new_lines |> String.replace(" ", "") 
  end

  def strip_new_lines(js) do
    js |> String.replace("\n", "")
  end
end