defmodule ElixirScript.Translator.UMD.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate module to umd" do
    ex_ast = quote do
      defmodule Elephant do
        @ul "#todo-list"

        def something() do
          @ul
        end
      end
    end

    js_code = """
         (function(root, factory) {
         if (typeof define === 'function' && define.amd) {
             define([], factory)
         } else if (typeof exports === 'object') {
             module.exports = factory()
         } else {
             root.returnExports = factory()
         }
    """

    assert_translation(ex_ast, js_code, :umd)
  end
end