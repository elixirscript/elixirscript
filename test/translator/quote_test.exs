defmodule ElixirScript.Translator.Quote.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate quote" do
    ex_ast = quote do: quote do: sum(1, 2, 3)
    js_code = "sum(1, 2, 3)"

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: quote do: sum(1, unquote(x), 3)
    js_code = "sum(1, function () { return x; }(), 3)"

    assert_translation(ex_ast, js_code)
  end
end