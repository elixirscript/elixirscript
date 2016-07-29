defmodule ElixirScript.Translator.Send.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "call send outside process" do
    ex_ast = quote do
      send(pid, "hello")
    end

    js_code = """
    Elixir$ElixirScript$Kernel.send(pid, 'hello')
    """

    assert_translation(ex_ast, js_code)
  end
end
