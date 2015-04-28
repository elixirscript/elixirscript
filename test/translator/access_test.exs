defmodule ElixirScript.Translator.Access.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate access" do
    ex_ast = quote do: a[:b]
    js_code = "a[Atom('b')]"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a["b"]
    js_code = "a['b']"

    assert_translation(ex_ast, js_code)
  end
end