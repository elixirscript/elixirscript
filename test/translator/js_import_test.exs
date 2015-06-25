defmodule ElixirScript.Translator.JSImport.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate js import statement" do
    ex_ast = quote do
      ElixirScript.js_import Hello.World
    end

    js_code = """
      import World from 'hello/world';
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate js import statement with from" do
    ex_ast = quote do
      ElixirScript.js_import Hello.World, from: "../hello/world"
    end

    js_code = """
      import World from '../hello/world';
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate js import statement with as" do
    ex_ast = quote do
      ElixirScript.js_import Hello.World, as: Pizza
    end

    js_code = """
      import {default as Pizza } from 'hello/world';
    """

    assert_translation(ex_ast, js_code)
  end

end