defmodule ElixirScript.Translator.UMD.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate module to umd" do
    ex_ast = quote do
      defmodule Elephant do
        @ul JQuery.("#todo-list")

        def something() do
          @ul
        end

        defgenp something_else() do
        end
      end
    end

    js_code = """
         (function(root, factory) {
    """

    assert_translation(ex_ast, js_code, :umd)
  end
end