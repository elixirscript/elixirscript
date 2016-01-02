defmodule ElixirScript.Translator.List.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "Elixir.Core.SpecialForms.list(1, 2, 3)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "Elixir.Core.SpecialForms.list('a', 'b', 'c')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "Elixir.Core.SpecialForms.list(Symbol.for('a'), Symbol.for('b'), Symbol.for('c'))"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "Elixir.Core.SpecialForms.list(Symbol.for('a'), 2, 'c')"

    assert_translation(ex_ast, js_code)
  end

  test "concatenate lists" do
    ex_ast = quote do: [1, 2, 3] ++ [4, 5, 6]
    js_code = "Elixir.Core.SpecialForms.list(1,2,3).concat(Elixir.Core.SpecialForms.list(4,5,6))"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: this.list ++ [4, 5, 6]
    js_code = "Elixir.Core.Functions.call_property(this,'list').concat(Elixir.Core.SpecialForms.list(4,5,6))"

    assert_translation(ex_ast, js_code)
  end

  test "prepend element" do
    ex_ast = quote do: [x | list]

    js_code = "Elixir.Core.SpecialForms.list(x).concat(list)"

    assert_translation(ex_ast, js_code)
  end

  test "prepend element in function" do
    ex_ast = quote do
       fn (_) -> [x|list] end
    end

    js_code = """
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function(){
      return Elixir.Core.SpecialForms.list(x).concat(list);
    }))
    """

    assert_translation(ex_ast, js_code)
  end
end
