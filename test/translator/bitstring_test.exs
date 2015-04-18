defmodule ElixirScript.Translator.Bitstring.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate bitstring" do
    ex_ast = quote do: <<1, 2, 3, 4, 5, 6>>
    assert_translation(ex_ast, "[1, 2, 3, 4, 5, 6]")

    ex_ast = quote do: <<1, "foo">>
    assert_translation(ex_ast, "[1, 'foo']")
  end
end