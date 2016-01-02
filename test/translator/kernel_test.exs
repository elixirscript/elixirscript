defmodule ElixirScript.Translator.Kernel.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "max" do
    ex_ast = quote do
      max(1, 2)
    end

    js_code = """
    Elixir$ElixirScript$Kernel.max(1, 2)
    """

    assert_translation(ex_ast, js_code)

  end

  test "apply/2" do
    ex_ast = quote do
      apply(fun, [1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.apply(fun, Object.freeze([1, 2, 3]))
    """

    assert_translation(ex_ast, js_code)

  end

  test "apply/3" do
    ex_ast = quote do
      apply(Enum, :reverse, [1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.apply(Enum,Symbol.for('reverse'),Object.freeze([1, 2, 3]))
    """

    assert_translation(ex_ast, js_code)

  end

  test "hd" do
    ex_ast = quote do
      hd([1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.hd(Object.freeze([1, 2, 3]))
    """

    assert_translation(ex_ast, js_code)

  end

  test "tl" do
    ex_ast = quote do
      tl([1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.tl(Object.freeze([1, 2, 3]))
    """

    assert_translation(ex_ast, js_code)

  end
end
