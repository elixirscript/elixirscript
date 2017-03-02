defmodule ElixirScript.Experimental.Function.Test do
  use ExUnit.Case
  alias ESTree.Tools.Builder, as: J 
  alias ElixirScript.Experimental.Function   

  test "compile function with no body" do
    result = Function.compile({{:hello, 0}, :defp, [line: 4], [{[line: 4], [], [], nil}]})

    assert result.type == "VariableDeclaration"
    assert hd(result.declarations).id == J.identifier("hello0")
    assert hd(result.declarations).init.type == "CallExpression"
  end
end