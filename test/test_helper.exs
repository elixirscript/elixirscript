ExUnit.start()

defmodule ExToJS.TestHelper do
  use ExUnit.Case
  
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


  def assert_translation(ex_ast, js_code) do
    assert ex_ast_to_js(ex_ast) |> strip_spaces == strip_spaces(js_code)
  end
end