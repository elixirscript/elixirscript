defmodule ExToJS.Translator.Atom.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate atom" do
    ex_ast = quote do: :atom
    assert_translation(ex_ast, "Symbol('atom')")
  end
end