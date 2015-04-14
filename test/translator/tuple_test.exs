defmodule ElixirScript.Translator.Tuple.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate tuple" do
    ex_ast = quote do: {1, 2}
    js_code = "Tuple(1, 2)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {1, 2, 3}
    js_code = "Tuple(1, 2, 3)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {"a", "b", "c"}
    js_code = "Tuple('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, :b, :c}
    js_code = "Tuple(Atom('a'), Atom('b'), Atom('c'))" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, 2, "c"}
    js_code = "Tuple(Atom('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end
end