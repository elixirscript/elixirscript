defmodule ExToJS.SpiderMonkey.Test do
  use ExUnit.Case
  alias ExToJS.SpiderMonkey
  alias ExToJS.SpiderMonkey.Nodes

  test "parse nil" do
    assert SpiderMonkey.parse(nil) == Nodes.literal(nil)
  end

  test "parse numbers" do
    assert SpiderMonkey.parse(1) == Nodes.literal(1)
    assert SpiderMonkey.parse(1.0) == Nodes.literal(1.0)
  end

  test "parse string" do
    assert SpiderMonkey.parse("Hello") == Nodes.literal("Hello")
  end

  test "parse atom" do
    assert SpiderMonkey.parse(:atom) == Nodes.symbol(:atom)
  end

  test "parse list" do
    assert SpiderMonkey.parse([1, 2, 3]) == Nodes.array([1,2,3])
    assert SpiderMonkey.parse(["1", "2", "3"]) == Nodes.array(["1","2","3"])
  end

  test "parse tuple" do
    assert SpiderMonkey.parse({1, 2}) ==  Nodes.array([1,2])
  end

  test "parse map" do
    assert SpiderMonkey.parse({:%{}, [], []}) == Nodes.object([])
    assert SpiderMonkey.parse({:%{}, [], [one: 1]}) ==  Nodes.object([one: 1])
    assert SpiderMonkey.parse({:%{}, [], [one: 1, two: "2"]}) == Nodes.object([one: 1, two: "2"])
  end

  test "parse def" do
    empty_function = {:def, [context: Elixir, import: Kernel],
     [{:a, [context: Elixir], [{:f, [], Elixir}, {:g, [], Elixir}]}, [do: nil]]}

    assert SpiderMonkey.parse(empty_function) == Nodes.method(:a, [{:f, [], Elixir}, {:g, [], Elixir}], nil)
  end

  test "parse assignment" do
    assert SpiderMonkey.parse({:=, [], [{:f, [], Elixir}, 1]}) == Nodes.variable(:f, 1)
  end

  test "parse defmodule" do
    empty_module = {:defmodule, [context: Elixir, import: Kernel],
 [{:__aliases__, [alias: false], [:Hello]}, [do: nil]]}

    assert SpiderMonkey.parse(empty_module) == Nodes.class("Hello", nil)

    module_with_aliases = {:defmodule, [context: Elixir, import: Kernel],
 [{:__aliases__, [alias: false], [:Hello]},
  [do: {:__block__, [],
    [{:alias, [context: Elixir], [{:__aliases__, [alias: false], [:World]}]},
     {:alias, [context: Elixir], [{:__aliases__, [alias: false], [:Pizza]}]},
     {:def, [context: Elixir, import: Kernel],
      [{:g, [context: Elixir], []}, [do: nil]]}]}]]}

    assert SpiderMonkey.parse(module_with_aliases) == Nodes.class("Hello", nil)   
  end
end
