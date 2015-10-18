defmodule ElixirScript.Translator.Kernel.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "max" do
    ex_ast = quote do
      max(1, 2)
    end

    js_code = """
    Math.max(1, 2)
    """

    assert_translation(ex_ast, js_code) 

  end

  should "apply/2" do
    ex_ast = quote do
      apply(fun, [1, 2, 3])
    end

    js_code = """
    fun(1,2,3)
    """

    assert_translation(ex_ast, js_code) 

  end

  should "apply/3" do
    ex_ast = quote do
      apply(Enum, :reverse, [1, 2, 3])
    end

    js_code = """
    Elixir.Enum.reverse(1,2,3)
    """

    assert_translation(ex_ast, js_code) 

  end

  should "hd" do
    ex_ast = quote do
      hd([1, 2, 3])
    end

    js_code = """
    Elixir.Kernel.SpecialForms.list(1,2,3)[0]
    """

    assert_translation(ex_ast, js_code) 

  end

  should "tl" do
    ex_ast = quote do
      tl([1, 2, 3])
    end

    js_code = """
    Elixir.Kernel.SpecialForms.list(1,2,3).slice(1)
    """

    assert_translation(ex_ast, js_code) 

  end
end