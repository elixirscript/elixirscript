defmodule ElixirScript.Translator.Kernel.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate range" do
    ex_ast = quote do
      1..4
    end

    js_code = """
      Range(1,4)
    """

    assert_translation(ex_ast, js_code)
  end
end