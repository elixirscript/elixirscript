defmodule ExToJS.Translator.Number.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate numbers" do
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