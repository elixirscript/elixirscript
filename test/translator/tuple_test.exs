defmodule ExToJS.Translator.Tuple.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate tuple" do
    ex_ast = quote do: {1, 2}
    js_code = "[1, 2]"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {1, 2, 3}
    js_code = "[1, 2, 3]"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {"a", "b", "c"}
    js_code = "['a', 'b', 'c']"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, :b, :c}
    js_code = "[Symbol('a'), Symbol('b'), Symbol('c')]" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, 2, "c"}
    js_code = "[Symbol('a'), 2, 'c']"

    assert_translation(ex_ast, js_code)
  end
end