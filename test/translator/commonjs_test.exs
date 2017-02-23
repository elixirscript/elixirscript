defmodule ElixirScript.Translator.CommonJS.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate module to commonjs" do
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
     module.exports = Elixir
    """

    assert_translation(ex_ast, js_code, :common)
  end
end
