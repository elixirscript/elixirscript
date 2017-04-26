defmodule ElixirScript.Lib.Elixir.Kernel.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate range" do
    ex_ast = quote do
      1..4
    end

    js_code = """
    
    Elixir.ElixirScript.Range.__load(Elixir).__struct__(Object.freeze({
      [Symbol.for('first')]: 1,
      [Symbol.for('last')]: 4
    }))
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate sigil_r" do
    ex_ast = quote do
      ~r/foo/
    end

    js_code = """
    Elixir.ElixirScript.Regex.__load(Elixir).compile__emark__('foo', '')
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate sigil_r with options" do
    ex_ast = quote do
      ~r/foo/i
    end

    js_code = """
    Elixir.ElixirScript.Regex.__load(Elixir).compile__emark__('foo', 'i')
    """

    assert_translation(ex_ast, js_code)
  end
end
