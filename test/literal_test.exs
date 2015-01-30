defmodule LiteralTest do
  use ExUnit.Case

  test "nil parsing" do
    assert ElixirScript.parse(nil) == "null"
  end

  test "number parsing" do
    assert ElixirScript.parse(1) == "1"
    assert ElixirScript.parse(1.0) == "1.0"
  end

  test "string parsing" do
    assert ElixirScript.parse("Hello") == "\"Hello\""
  end

  test "atom parsing" do
    assert ElixirScript.parse(:atom) == "Symbol(\"atom\")"
  end

  test "array parsing" do
    assert ElixirScript.parse([1, 2, 3]) == "[1,2,3]"
    assert ElixirScript.parse(["1", "2", "3"]) == "[\"1\",\"2\",\"3\"]"
  end

  test "tuple parsing" do
    assert ElixirScript.parse({1, 2}) == "[1,2]"
  end

  test "map parsing" do
    assert ElixirScript.parse({:%{}, [], []}) == "{}"
    assert ElixirScript.parse({:%{}, [], [one: 1]}) == "{one:1}"
    assert ElixirScript.parse({:%{}, [], [one: 1, two: "2"]}) == "{one:1,two:\"2\"}"
  end

  test "def parsing" do
    empty_function = {:def, [context: Elixir, import: Kernel],
     [{:a, [context: Elixir], [{:f, [], Elixir}, {:g, [], Elixir}]}, [do: nil]]}

    assert ElixirScript.parse(empty_function) == "function a(f,g){}"
  end

  test "assignment parsing" do
    assert ElixirScript.parse({:=, [], [{:f, [], Elixir}, 1]}) == "var f = 1;"
  end
end
