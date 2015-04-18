defmodule ElixirScript.Translator.Number.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate numbers" do
    ex_ast = quote do: 1
    assert_translation(ex_ast, "1")

    ex_ast = quote do: 1_000
    assert_translation(ex_ast, "1000")

    ex_ast = quote do: 1.1
    assert_translation(ex_ast, "1.1")

    ex_ast = quote do: -1.1
    assert_translation(ex_ast, "-1.1")
  end
end