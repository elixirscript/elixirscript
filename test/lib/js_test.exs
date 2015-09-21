defmodule ElixirScript.Lib.JS.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate new" do
    ex_ast = quote do
      JS.new A.B, [1, 2, 3]
    end

    js_code = """
      new A.B(1, 2, 3)
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      JS.new A, [1, 2, 3]
    end

    js_code = """
      new A(1, 2, 3)
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate update" do
    ex_ast = quote do
      JS.update A, "b", [1, 2, 3]
    end

    js_code = """
      A['b'] = Kernel.SpecialForms.list(1, 2, 3)
    """

    assert_translation(ex_ast, js_code)
  end
end