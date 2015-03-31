defmodule ExToJS.Translator.Tuple.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate tuple" do
    ex_ast = quote do: {1, 2}
    js_code = "{ '0': 1, '1': 2 }"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {1, 2, 3}
    js_code = "{ '0': 1, '1': 2, '2': 3 }"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {"a", "b", "c"}
    js_code = "{ '0': 'a', '1':'b', '2':'c' }"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, :b, :c}
    js_code = "{ '0': Symbol('a'), '1': Symbol('b'), '2': Symbol('c') }" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, 2, "c"}
    js_code = "{'0': Symbol('a'), '1': 2, '2': 'c' }"

    assert_translation(ex_ast, js_code)
  end
end