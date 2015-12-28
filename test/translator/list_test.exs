defmodule ElixirScript.Translator.List.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "Elixir.Core.List(1, 2, 3)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "Elixir.Core.List('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "Elixir.Core.List(Symbol.for('a'), Symbol.for('b'), Symbol.for('c'))"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "Elixir.Core.List(Symbol.for('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end

  should "concatenate lists" do
    ex_ast = quote do: [1, 2, 3] ++ [4, 5, 6]
    js_code = "Elixir.Core.Functions.concat_lists(Elixir.Core.List(1,2,3),Elixir.Core.List(4,5,6))"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: this.list ++ [4, 5, 6]
    js_code = "Elixir.Core.Functions.concat_lists(Elixir.Core.Functions.call_property(this,'list'),Elixir.Core.List(4,5,6))"

    assert_translation(ex_ast, js_code)
  end

  should "prepend element" do
    ex_ast = quote do: [x|list]

    js_code = "Elixir.Core.prepend_to_list(list,x)"

    assert_translation(ex_ast, js_code)
  end

  should "prepend element in function" do
    ex_ast = quote do
       fn (_) -> [x|list] end
    end

    js_code = """
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function(){
      return Elixir.Core.prepend_to_list(list,x);
    }))
    """

    assert_translation(ex_ast, js_code)
  end
end
