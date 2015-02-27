ExUnit.start()

defmodule ExToJS.TestHelper do
  def ex_ast_to_js(ex_ast) do

    js_ast = ExToJS.Translator.translate(ex_ast)
    result = ExToJS.javascript_ast_to_code(js_ast)

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