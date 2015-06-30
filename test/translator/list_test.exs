defmodule ElixirScript.Translator.List.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "Erlang.list(1, 2, 3)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "Erlang.list('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "Erlang.list(Erlang.atom('a'), Erlang.atom('b'), Erlang.atom('c'))" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "Erlang.list(Erlang.atom('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end

  should "concatenate lists" do
    ex_ast = quote do: [1, 2, 3] ++ [4, 5, 6]
    js_code = "Erlang.list.concat(Erlang.list(1, 2, 3), Erlang.list(4, 5, 6));"  

    ex_ast = quote do: this.list ++ [4, 5, 6]
    js_code = "Erlang.list.concat(this.list, Erlang.list(4, 5, 6));"    
  end
end