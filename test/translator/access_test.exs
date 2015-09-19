defmodule ElixirScript.Translator.Access.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate access" do
    ex_ast = quote do: a[:b]
    js_code = "a.get(Erlang.atom('b'))"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a["b"]
    js_code = "a.get('b')"

    assert_translation(ex_ast, js_code)
  end
end