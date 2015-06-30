defmodule ElixirScript.Translator.Atom.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate atom" do
    ex_ast = quote do: :atom
    assert_translation(ex_ast, "Erlang.atom('atom')")
  end
end