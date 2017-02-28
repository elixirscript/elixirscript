defmodule ElixirScript.Translator.Access.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate access" do
    ex_ast = quote do
       a = []
       a[:b]
    end
    js_code = "a[Symbol.for('b')]"

    assert_translation(ex_ast, js_code)
  end
end
