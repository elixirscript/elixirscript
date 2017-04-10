defmodule ElixirScript.Translator.JS.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper


  test "translate global function calls" do
    ex_ast = quote do: JS.alert("hi")
    js_code = "Bootstrap.Core.global.alert('hi')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.back()
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.global, 'back')"

    assert_translation(ex_ast, js_code)
  end

  test "translate global properties" do
    ex_ast = quote do: JS.length
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.global, 'length')"

    assert_translation(ex_ast, js_code)
  end

  test "translate global module" do
    ex_ast = quote do: JS.String.toString()
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.global.String, 'toString')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.String.raw("hi")
    js_code = "Bootstrap.Core.global.String.raw('hi')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.Something.Other.raw("hi")
    js_code = "Bootstrap.Core.global.Something.Other.raw('hi')"

    assert_translation(ex_ast, js_code)
  end

  test "translate global lowercase" do
    ex_ast = quote do: JS.console.log("hi")
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.global, 'console').log('hi')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.window.length
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.Functions.call_property(Bootstrap.Core.global, 'window'), 'length')"

    assert_translation(ex_ast, js_code)
  end


end
