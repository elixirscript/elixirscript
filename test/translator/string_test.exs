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
    assert_translation(ex_ast, "'Hello ' + Elixir$ElixirScript$String$Chars.to_string(Elixir$ElixirScript$Kernel.length(Elixir.Core.SpecialForms.list()))")
  end

  should "translate multiline string interpolation" do
    ex_ast = quote do: """
    Hello #{length([])}
    """
    assert_translation(ex_ast, "'Hello ' + (Elixir$ElixirScript$String$Chars.to_string(Elixir$ElixirScript$Kernel.length(Elixir.Core.SpecialForms.list())) + '\\n')")

    ex_ast = quote do: """
    Hello #{length([])}
    How are you, #{length([])}?
    """
    assert_translation(ex_ast, "'Hello ' + (Elixir$ElixirScript$String$Chars.to_string(Elixir$ElixirScript$Kernel.length(Elixir.Core.SpecialForms.list())) + ('\\nHow are you, ' + (Elixir$ElixirScript$String$Chars.to_string(Elixir$ElixirScript$Kernel.length(Elixir.Core.SpecialForms.list())) + '?\\n')))")
  end
end
