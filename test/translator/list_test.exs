defmodule ElixirScript.Translator.List.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "Kernel.SpecialForms.list(1, 2, 3)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "Kernel.SpecialForms.list('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "Kernel.SpecialForms.list(Kernel.SpecialForms.atom('a'), Kernel.SpecialForms.atom('b'), Kernel.SpecialForms.atom('c'))" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "Kernel.SpecialForms.list(Kernel.SpecialForms.atom('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end

  should "concatenate lists" do
    ex_ast = quote do: [1, 2, 3] ++ [4, 5, 6]
    js_code = "Kernel.SpecialForms.list(1,2,3).concat(Kernel.SpecialForms.list(4,5,6))"  

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: this.list ++ [4, 5, 6]
    js_code = "JS.get_property_or_call_function(this,'list').concat(Kernel.SpecialForms.list(4,5,6))"

    assert_translation(ex_ast, js_code)    
  end
end