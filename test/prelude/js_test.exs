defmodule ElixirScript.Lib.JS.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate new" do
    ex_ast = quote do
      require JS

      def execute() do
        JS.new A.B, [1, 2, 3]
      end
    end

    js_code = """
      new A.B(1, 2, 3)
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      require JS

      def execute() do
        JS.new A, [1, 2, 3]
      end
    end

    js_code = """
      new A(1, 2, 3)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate update" do
    ex_ast = quote do
      require JS

      def execute() do
        JS.update A, %{"b" => [1, 2, 3]}
      end
    end

    js_code = """
    Object.assign(A, Object.freeze({
      b: Object.freeze([1, 2, 3])
    }))
    """

    assert_translation(ex_ast, js_code)
  end
end
