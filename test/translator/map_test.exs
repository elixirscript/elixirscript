defmodule ElixirScript.Translator.Map.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate empty map" do
    ex_ast = quote do: %{}
    js_code = "Elixir.Core.SpecialForms.map({})"

    assert_translation(ex_ast, js_code)
  end

  test "translate map with elements" do
    ex_ast = quote do: %{one: "one", two: "two"}
    js_code = "Elixir.Core.SpecialForms.map({[Symbol.for('one')]: 'one', [Symbol.for('two')]: 'two'})"

    assert_translation(ex_ast, js_code)
  end

  test "translate map within map" do
    ex_ast = quote do: %{one: "one", two: %{three: "three"}}
    js_code = """
      Elixir.Core.SpecialForms.map({
        [Symbol.for('one')]: 'one',
        [Symbol.for('two')]: Elixir.Core.SpecialForms.map({
             [Symbol.for('three')]: 'three'
        })
      })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate map with string keys" do
    ex_ast = quote do: %{"one" => "one", "two" => "two"}
    js_code = """
     Elixir.Core.SpecialForms.map({
             one: 'one',     two: 'two'
       })
    """

    assert_translation(ex_ast, js_code)
  end


  test "translate map update" do
    ex_ast = quote do: %{ map | value: 1 }
    js_code = """
     Elixir.Core.SpecialForms.map_update(map,{
             [Symbol.for('value')]: 1
       })
    """

    assert_translation(ex_ast, js_code)
  end
end
