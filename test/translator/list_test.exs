defmodule ElixirScript.Translator.List.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "Object.freeze([1, 2, 3])"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "Object.freeze(['a', 'b', 'c'])"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "Object.freeze([Symbol.for('a'), Symbol.for('b'), Symbol.for('c')])"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "Object.freeze([Symbol.for('a'), 2, 'c'])"

    assert_translation(ex_ast, js_code)
  end

  test "concatenate lists" do
    ex_ast = quote do: [1, 2, 3] ++ [4, 5, 6]
    js_code = "Object.freeze([1, 2, 3]).concat(Object.freeze([4, 5, 6]))"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      list = []
       list ++ [4, 5, 6]
    end
    js_code = "list.concat(Object.freeze([4, 5, 6]))"

    assert_translation(ex_ast, js_code)
  end

  test "prepend element" do
    ex_ast = quote do
      x = 1
      list = []
      [x | list]
    end

    js_code = "Object.freeze([x]).concat(list)"

    assert_translation(ex_ast, js_code)
  end

  test "prepend element in function" do
    ex_ast = quote do
        x = 1
        list = []

       fn (_) -> [x|list] end
    end

    js_code = """
    Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(__ignored__){
      return Object.freeze([x]).concat(list);
    }))
    """

    assert_translation(ex_ast, js_code)
  end
end
