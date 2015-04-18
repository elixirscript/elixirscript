defmodule ElixirScript.Translator.Tuple.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate 2 item tuple" do
    ex_ast = quote do: {1, 2}
    js_code = "Tuple(1, 2)"

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple item tuple" do
    ex_ast = quote do: {1, 2, 3, 4, 5}
    js_code = "Tuple(1, 2, 3, 4, 5)"

    assert_translation(ex_ast, js_code)
  end

  should "translate tuples of different typed items" do
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