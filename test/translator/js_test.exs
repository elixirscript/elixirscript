defmodule ElixirScript.Translator.JS.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper


  test "translate global function calls" do
    ex_ast = quote do: JS.alert("hi")
    js_code = "Bootstrap.Core.Functions.get_global().alert('hi')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.back()
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.Functions.get_global(), 'back')"

    assert_translation(ex_ast, js_code)
  end

  test "translate global properties" do
    ex_ast = quote do: JS.length
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.Functions.get_global(), 'length')"

    assert_translation(ex_ast, js_code)
  end

  test "translate global module" do
    ex_ast = quote do: JS.String.toString()
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.Functions.get_global().String, 'toString')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.String.raw("hi")
    js_code = "Bootstrap.Core.Functions.get_global().String.raw('hi')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.Something.Other.raw("hi")
    js_code = "Bootstrap.Core.Functions.get_global().Something.Other.raw('hi')"

    assert_translation(ex_ast, js_code)
  end

  test "translate global lowercase" do
    ex_ast = quote do: JS.console.log("hi")
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.Functions.get_global(), 'console').log('hi')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: JS.window.length
    js_code = "Bootstrap.Core.Functions.call_property(Bootstrap.Core.Functions.call_property(Bootstrap.Core.Functions.get_global(), 'window'), 'length')"

    assert_translation(ex_ast, js_code)
  end


end
