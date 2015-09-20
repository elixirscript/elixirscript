defmodule ElixirScript.Translator.Map.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate empty map" do
    ex_ast = quote do: %{}
    js_code = "Kernel.SpecialForms.map({})"

    assert_translation(ex_ast, js_code)
  end

  should "translate map with elements" do
    ex_ast = quote do: %{one: "one", two: "two"}
    js_code = "Kernel.SpecialForms.map({[Kernel.SpecialForms.atom('one')]: 'one', [Kernel.SpecialForms.atom('two')]: 'two'})"

    assert_translation(ex_ast, js_code)
  end

  should "translate map within map" do
    ex_ast = quote do: %{one: "one", two: %{three: "three"}}
    js_code = "Kernel.SpecialForms.map({[Kernel.SpecialForms.atom('one')]: 'one', [Kernel.SpecialForms.atom('two')]: {[Kernel.SpecialForms.atom('three')]: 'three'}})"

    assert_translation(ex_ast, js_code)
  end

  should "translate map with string keys" do
    ex_ast = quote do: %{"one" => "one", "two" => "two"}
    js_code = "Kernel.SpecialForms.map({['one']: 'one', ['two']: 'two'})"

    assert_translation(ex_ast, js_code)
  end
end
