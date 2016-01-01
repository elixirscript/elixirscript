defmodule ElixirScript.Translator.Access.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate access" do
    ex_ast = quote do: a[:b]
    js_code = "a[Symbol.for('b')]"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a["b"]
    js_code = "a['b']"

    assert_translation(ex_ast, js_code)
  end
end
