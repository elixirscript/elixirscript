defmodule ElixirScript.Translator.Map.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate empty map" do
    ex_ast = quote do: %{}
    js_code = "{}"

    assert_translation(ex_ast, js_code)
  end

  test "translate map with elements" do
    ex_ast = quote do: %{one: "one", two: "two"}
    js_code = "{'one': 'one', 'two': 'two'}"

    assert_translation(ex_ast, js_code)
  end

  test "translate map within map" do
    ex_ast = quote do: %{one: "one", two: %{three: "three"}}
    js_code = "{'one': 'one', 'two': {'three': 'three'}}"

    assert_translation(ex_ast, js_code)
  end
end