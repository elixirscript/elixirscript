defmodule ElixirScript.Translator.Kernel.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "max" do
    ex_ast = quote do
      max(1, 2)
    end

    js_code = """
    Elixir$ElixirScript$Kernel.max(1, 2)
    """

    assert_translation(ex_ast, js_code)

  end

  should "apply/2" do
    ex_ast = quote do
      apply(fun, [1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.apply(fun, Elixir.Core.List(1,2,3))
    """

    assert_translation(ex_ast, js_code)

  end

  should "apply/3" do
    ex_ast = quote do
      apply(Enum, :reverse, [1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.apply(Enum,Symbol.for('reverse'),Elixir.Core.List(1,2,3))
    """

    assert_translation(ex_ast, js_code)

  end

  should "hd" do
    ex_ast = quote do
      hd([1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.hd(Elixir.Core.List(1,2,3))
    """

    assert_translation(ex_ast, js_code)

  end

  should "tl" do
    ex_ast = quote do
      tl([1, 2, 3])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.tl(Elixir.Core.List(1,2,3))
    """

    assert_translation(ex_ast, js_code)

  end
end
