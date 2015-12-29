defmodule ElixirScript.Lib.Elixir.Kernel.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate range" do
    ex_ast = quote do
      1..4
    end

    js_code = """
    Elixir$ElixirScript$Range.Elixir$ElixirScript$Range.create(Elixir.Core.SpecialForms.map({
      [Symbol.for('first')]: 1,
      [Symbol.for('last')]: 4
    }))
    """

    assert_translation(ex_ast, js_code)
  end
end
