defmodule ElixirScript.Translator.Bitwise.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "bitwise when imported" do
    ex_ast = quote do
      import Bitwise
      1 &&& 2
    end

    js_code = "1 & 2"

    assert_translation(ex_ast, js_code)
  end
end
