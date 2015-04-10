defmodule ExToJS.Translator.Atom.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate atom" do
    ex_ast = quote do: :atom
    assert_translation(ex_ast, "Atom('atom')")
  end
end