defmodule ExToJS.Translator.Tuple.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate tuple" do
    ex_ast = quote do: {1, 2}
    js_code = "{ '_0': 1, '_1': 2 }"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {1, 2, 3}
    js_code = "{ '_0': 1, '_1': 2, '_2': 3 }"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {"a", "b", "c"}
    js_code = "{ '_0': 'a', '_1':'b', '_2':'c' }"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, :b, :c}
    js_code = "{ '_0': Symbol('a'), '_1': Symbol('b'), '_2': Symbol('c') }" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, 2, "c"}
    js_code = "{'_0': Symbol('a'), '_1': 2, '_2': 'c' }"

    assert_translation(ex_ast, js_code)
  end
end