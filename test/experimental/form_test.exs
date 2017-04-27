defmodule ElixirScript.Experimental.Form.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper
  alias ElixirScript.Experimental.Form

  test "nil" do
    result = Form.compile(nil, %{})
    assert generate_js(result) == "null"
  end

  test "integer" do
    result = Form.compile(1, %{})
    assert generate_js(result) == "1"
  end

  test "negative integer" do
    result = Form.compile(-1, %{})
    assert generate_js(result) == "-1"
  end

  test "atom" do
    result = Form.compile(:atom, %{})
    assert generate_js(result) == "Symbol.for('atom')"
  end

  test "upper case atom" do
    result = Form.compile(Atom, %{})
    assert generate_js(result) == "Elixir_Atom"
  end

  test "float" do
    result = Form.compile(1.0, %{})
    assert generate_js(result) == "1.0"
  end

  test "binary" do
    result = Form.compile("hello", %{})
    assert generate_js(result) == "'hello'"
  end

  test "2-element tuple" do
    result = Form.compile({1, 2}, %{})
    assert generate_js(result) == "Bootstrap.Core.Tuple(1, 2)"
  end

  test "3-element tuple" do
    result = Form.compile({:{}, [], [1, 2, 3]}, %{})
    assert generate_js(result) == "Bootstrap.Core.Tuple(1, 2, 3)"
  end

  test "list" do
    result = Form.compile([1, 2, 3], %{})
    assert generate_js(result) == "[1, 2, 3]"
  end

  test "map" do
    result = Form.compile({:%{}, [], [a: 1, b: 2, c: 3]}, %{})
    generated_js = generate_js(result)

    assert generated_js =~ "[Symbol.for('a')]: 1"
    assert generated_js =~ "[Symbol.for('b')]: 2"
    assert generated_js =~ "[Symbol.for('c')]: 3"
  end

  test "bitstring" do
    result = Form.compile({:<<>>, [], [1, 2, 3]}, %{})
    generated_js = generate_js(result)

    assert generated_js =~ "BitString.integer(1)"
    assert generated_js =~ "new Bootstrap.Core.BitString"
  end

  test "match" do
    result = Form.compile({:=, [], [{:a, [], nil}, 1]}, %{})
    generated_js = generate_js(result)

    assert generated_js =~ "let [a] ="
    assert generated_js =~ "Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(), 1)"
  end

  test "variable" do
    result = Form.compile({:a, [], nil}, %{})
    assert generate_js(result) == "a"
  end

  test "super" do
    result = Form.compile({:super, [function: {:name, 2}], []}, %{})
    assert generate_js(result) == "name0()"
  end
end
