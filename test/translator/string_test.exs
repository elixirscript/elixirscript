defmodule ElixirScript.Translator.String.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate string" do
    ex_ast = quote do: "Hello"
    assert_translation(ex_ast, "'Hello'")
  end

  test "translate multiline string" do
    ex_ast = quote do: """
    Hello
    This is another line
    """
    assert_translation(ex_ast, "'Hello\\nThis is another line\\n'")
  end

  test "translate string concatenation" do
    ex_ast = quote do: "Hello" <> "World"
    assert_translation(ex_ast, "'Hello' + 'World'")
  end

  test "translate string interpolation" do
    ex_ast = quote do: "Hello #{"world"}"
    assert_translation(ex_ast, "'Hello ' + Elixir.ElixirScript.String.Chars.__load(Elixir).to_string('world')")

    ex_ast = quote do: "Hello #{length([])}"
    assert_translation(ex_ast, "'Hello ' + Elixir.ElixirScript.String.Chars.__load(Elixir).to_string(Elixir.ElixirScript.Kernel.__load(Elixir).length(Object.freeze([])))")
  end

  test "translate multiline string interpolation" do
    ex_ast = quote do: """
    Hello #{length([])}
    """
    assert_translation(ex_ast, "'Hello ' + (Elixir.ElixirScript.String.Chars.__load(Elixir).to_string(Elixir.ElixirScript.Kernel.__load(Elixir).length(Object.freeze([]))) + '\\n')")

    ex_ast = quote do: """
    Hello #{length([])}
    How are you, #{length([])}?
    """
    assert_translation(ex_ast, "'Hello ' + (Elixir.ElixirScript.String.Chars.__load(Elixir).to_string(Elixir.ElixirScript.Kernel.__load(Elixir).length(Object.freeze([]))) + ('\\nHow are you, ' + (Elixir.ElixirScript.String.Chars.__load(Elixir).to_string(Elixir.ElixirScript.Kernel.__load(Elixir).length(Object.freeze([]))) + '?\\n')))")
  end
end
