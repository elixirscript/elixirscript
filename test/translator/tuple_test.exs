defmodule ElixirScript.Translator.Tuple.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate 2 item tuple" do
    ex_ast = quote do: {1, 2}
    js_code = "new Elixir.Core.Tuple(1, 2)"

    assert_translation(ex_ast, js_code)
  end

  test "translate multiple item tuple" do
    ex_ast = quote do: {1, 2, 3, 4, 5}
    js_code = "new Elixir.Core.Tuple(1, 2, 3, 4, 5)"

    assert_translation(ex_ast, js_code)
  end

  test "translate tuples of different typed items" do
    ex_ast = quote do: {"a", "b", "c"}
    js_code = "new Elixir.Core.Tuple('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, :b, :c}
    js_code = "new Elixir.Core.Tuple(Symbol.for('a'), Symbol.for('b'), Symbol.for('c'))"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, 2, "c"}
    js_code = "new Elixir.Core.Tuple(Symbol.for('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end
end
