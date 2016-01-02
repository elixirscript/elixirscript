defmodule ElixirScript.Lib.Elixir.Kernel.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate range" do
    ex_ast = quote do
      1..4
    end

    js_code = """
    Elixir$ElixirScript$Range.Elixir$ElixirScript$Range.create(Object.freeze({
      [Symbol.for('first')]: 1,
      [Symbol.for('last')]: 4
    }))
    """

    assert_translation(ex_ast, js_code)
  end
end
