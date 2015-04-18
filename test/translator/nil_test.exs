defmodule ElixirScript.Translator.Nil.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate nil" do
    ex_ast = quote do: nil
    assert_translation(ex_ast, "null")
  end
end