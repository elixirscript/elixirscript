defmodule ElixirScript.Translator.Nil.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate nil" do
    ex_ast = quote do: nil
    assert_translation(ex_ast, "null")
  end
end