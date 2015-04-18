exclude =
  if Node.alive?, do: [], else: [skip: true]

ExUnit.start(exclude: exclude, formatters: [ShouldI.CLIFormatter])

defmodule ElixirScript.TestHelper do
  use ShouldI
  
  def ex_ast_to_js(ex_ast) do

    js_ast = ElixirScript.Translator.translate(ex_ast)
    result = ElixirScript.javascript_ast_to_code(js_ast)

    case result do
      {:ok, js_code} ->
        js_code
      {:error, error} ->
        raise ElixirScript.ParseError, message: error
    end
  end

  def strip_spaces(js) do
    js |> strip_new_lines |> String.replace(" ", "") 
  end

  def strip_new_lines(js) do
    js |> String.replace("\n", "")
  end


  def assert_translation(ex_ast, js_code) do
    converted_code = ex_ast_to_js(ex_ast)

    assert converted_code |> strip_spaces == strip_spaces(js_code), """
    **Code Does Not Match **

    ***Expected***
    #{js_code}

    ***Actual***
    #{converted_code}
    """
  end
end