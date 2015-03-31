defmodule ExToJS.Translator.Bitstring.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate bitstring" do
    ex_ast = quote do: <<1, 2, 3, 4, 5, 6>>
    assert_translation(ex_ast, "[1, 2, 3, 4, 5, 6]")

    ex_ast = quote do: <<1, "foo">>
    assert_translation(ex_ast, "[1, 'foo']")
  end
end