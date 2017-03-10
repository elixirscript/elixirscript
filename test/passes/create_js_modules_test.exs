defmodule ElixirScript.Passes.CreateJSModules.Test do
  use ExUnit.Case

  import ElixirScript.TestHelper

  alias ElixirScript.Passes.CreateJSModules
  alias ESTree.Tools.Generator

  test "start" do
    ex_ast = quote do: CreateJSModules.start
    js = """
    Elixir.start = function(app, args) {
      app.__load(Elixir).start(Symbol.for('normal'), args)
    }
    """

    assert_translation(ex_ast, js)
  end

  test "load" do
    ex_ast = quote do: CreateJSModules.load
    js = """
    Elixir.load = function(module) {
        return module.__load(Elixir);
    }
    """

    assert_translation(ex_ast, js)
  end
end
