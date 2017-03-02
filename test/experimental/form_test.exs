defmodule ElixirScript.Experimental.Form.Test do
  use ExUnit.Case
  alias ESTree.Tools.Builder, as: J 
  alias ElixirScript.Experimental.Form   

  test "compile integer" do
    result = Form.compile(1)
    assert result == J.literal(1)
  end

  test "compile float" do
    result = Form.compile(1.0)
    assert result == J.literal(1.0)
  end

  test "compile binary" do
    result = Form.compile("hello")
    assert result == J.literal("hello")
  end

  test "compile 2-element tuple" do
    result = Form.compile({1, 2})
    assert result == J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      [J.literal(1), J.literal(2)]
    )
  end

  test "compile 3-element tuple" do
    result = Form.compile({:{}, [], [1, 2, 3]})
    assert result == J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      [J.literal(1), J.literal(2), J.literal(3)]
    )
  end

  test "compile list" do
    result = Form.compile([1, 2, 3])
    assert result == J.array_expression(
      [J.literal(1), J.literal(2), J.literal(3)]
    )
  end
end