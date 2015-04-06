defmodule ExToJS.Translator.String.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate string" do
    ex_ast = quote do: "Hello"
    assert_translation(ex_ast, "'Hello'")

    ex_ast = quote do: "Hello" <> "World"
    assert_translation(ex_ast, "'Hello' + 'World'")
  end

  @tag :skip
  test "translate string interpolation" do
    ex_ast = quote do: "Hello #{"world"}"
    assert_translation(ex_ast, "`Hello ${'world'}`")
  end
end