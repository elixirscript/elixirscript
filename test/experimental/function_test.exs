defmodule ElixirScript.Experimental.Function.Test do
  use ExUnit.Case
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Function
  import ElixirScript.TestHelper

  test "compile function with no body" do
    result = Function.compile({{:hello, 0}, :defp, [line: 4], [{[line: 4], [], [], nil}]})
    generated_js = generate_js(result)

    assert generated_js =~ "const hello0 ="
    assert generated_js =~ "Bootstrap.Core.Patterns.defmatch"
    assert generated_js =~ "return null"
  end
end
