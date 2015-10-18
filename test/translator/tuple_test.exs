defmodule ElixirScript.Translator.Tuple.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate 2 item tuple" do
    ex_ast = quote do: {1, 2}
    js_code = "Elixir.Kernel.SpecialForms.tuple(1, 2)"

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple item tuple" do
    ex_ast = quote do: {1, 2, 3, 4, 5}
    js_code = "Elixir.Kernel.SpecialForms.tuple(1, 2, 3, 4, 5)"

    assert_translation(ex_ast, js_code)
  end

  should "translate tuples of different typed items" do
    ex_ast = quote do: {"a", "b", "c"}
    js_code = "Elixir.Kernel.SpecialForms.tuple('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, :b, :c}
    js_code = "Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('a'), Elixir.Kernel.SpecialForms.atom('b'), Elixir.Kernel.SpecialForms.atom('c'))" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, 2, "c"}
    js_code = "Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end
end