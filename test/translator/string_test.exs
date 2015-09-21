defmodule ElixirScript.Translator.String.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate string" do
    ex_ast = quote do: "Hello"
    assert_translation(ex_ast, "'Hello'")
  end

  should "translate multiline string" do
    ex_ast = quote do: """
    Hello
    This is another line
    """
    assert_translation(ex_ast, "'Hello\\nThis is another line\\n'")
  end

  should "translate string concatenation" do
    ex_ast = quote do: "Hello" <> "World"
    assert_translation(ex_ast, "'Hello' + 'World'")
  end

  should "translate string interpolation" do
    ex_ast = quote do: "Hello #{"world"}"
    assert_translation(ex_ast, "'Hello ' + 'world'")

    ex_ast = quote do: "Hello #{length([])}"
    assert_translation(ex_ast, "'Hello ' + Kernel.to_string(Kernel.SpecialForms.list().length)")
  end

  should "translate multiline string interpolation" do
    ex_ast = quote do: """
    Hello #{length([])}
    """
    assert_translation(ex_ast, "'Hello ' + (Kernel.to_string(Kernel.SpecialForms.list().length) + '\\n')")

    ex_ast = quote do: """
    Hello #{length([])}
    How are you, #{length([])}?
    """
    assert_translation(ex_ast, "'Hello ' + (Kernel.to_string(Kernel.SpecialForms.list().length) + ('\\nHow are you, ' + (Kernel.to_string(Kernel.SpecialForms.list().length) + '?\\n')))")
  end
end