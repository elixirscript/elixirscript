defmodule ElixirScript.Translator.List.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "Elixir.Kernel.SpecialForms.list(1, 2, 3)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "Elixir.Kernel.SpecialForms.list('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.atom('a'), Elixir.Kernel.SpecialForms.atom('b'), Elixir.Kernel.SpecialForms.atom('c'))" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.atom('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end

  should "concatenate lists" do
    ex_ast = quote do: [1, 2, 3] ++ [4, 5, 6]
    js_code = "Elixir.Kernel.SpecialForms.list(1,2,3).concat(Elixir.Kernel.SpecialForms.list(4,5,6))"  

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: this.list ++ [4, 5, 6]
    js_code = "Elixir.JS.call_property(this,'list').concat(Elixir.Kernel.SpecialForms.list(4,5,6))"

    assert_translation(ex_ast, js_code)    
  end

  should "prepend element" do
    ex_ast = quote do: [x|list]

    js_code = "Elixir.List.prepend(list, x)"

    assert_translation(ex_ast, js_code) 
  end

  should "prepend element in function" do
    ex_ast = quote do
       fn (_) -> [x|list] end
    end

    js_code = """
    Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Patterns.wildcard()],function(){
      return Elixir.List.prepend(list, x);
    }))
    """

    assert_translation(ex_ast, js_code) 
  end
end