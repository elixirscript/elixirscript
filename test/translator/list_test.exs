defmodule ElixirScript.Translator.List.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "List(1, 2, 3)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "List('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "List(Atom('a'), Atom('b'), Atom('c'))" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "List(Atom('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end

  should "concatenate lists" do
    ex_ast = quote do: [1, 2, 3] ++ [4, 5, 6]
    js_code = "List.concat(List(1, 2, 3), List(4, 5, 6));"  

    ex_ast = quote do: this.list ++ [4, 5, 6]
    js_code = "List.concat(this.list, List(4, 5, 6));"    
  end
end