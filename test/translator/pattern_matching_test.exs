defmodule ElixirScript.Translator.PatternMatching.Test do
  use ShouldI
  import ElixirScript.TestHelper
  alias ElixirScript.Translator
  alias ElixirScript.Translator.PatternMatching.Match
  alias ElixirScript.Translator.Primitive
  alias ESTree.Tools.Builder, as: JS

  def make_list(values) when is_list(values) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier("Erlang"),
        JS.identifier("list")
      ),
      values
    )
  end

  def make_tuple(elements) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier("Erlang"),
        JS.identifier("tuple")
      ),
      elements
    )
  end

  should "match wildcard" do
    params = [{:_, [], Test}]
    result = Match.build_match(params)
    expected_result = { [Match.wildcard],  [] }

    assert result == expected_result
  end

  should "match one identifier param" do
    params = [{:a, [], Test}]
    result = Match.build_match(params)
    expected_result = {[Match.parameter],  [JS.identifier("a")]}

    assert result == expected_result
  end

  should "match multiple identifier params" do
    params = [{:a, [], Test}, {:b, [], Test}, {:c, [], Test}]
    result = Match.build_match(params)
    expected_result = { 
      List.duplicate(Match.parameter, 3),  
      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
    }

    assert result == expected_result
  end

  should "match head and tail param" do
    params = [[{:|, [], [{:head, [], Elixir}, {:tail, [], Elixir}]}]]
    result = Match.build_match(params)
    expected_result = { 
      [Match.headTail],  
      [JS.identifier("head"), JS.identifier("tail")]
    }

    assert result == expected_result
  end

  should "match prefix param" do
    params = [{:<>, [context: Elixir, import: Kernel], ["Bearer ", {:token, [], Elixir}]}]
    result = Match.build_match(params)
    expected_result = { 
      [Match.startsWith("Bearer ")],  
      [JS.identifier("token")]
    }

    assert result == expected_result
  end

  should "match list" do
    params = [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}]]
    result = Match.build_match(params)
    expected_result = { 
      [make_list(List.duplicate(Match.parameter, 3))],  
      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
    }

    assert result == expected_result
  end

  should "match list with a literal" do
    params = [[1, {:b, [], Elixir}, {:c, [], Elixir}]]
    result = Match.build_match(params)
    expected_result = { 
      [make_list([JS.literal(1), Match.parameter, Match.parameter])],  
      [JS.identifier("b"), JS.identifier("c")]
    }

    assert result == expected_result
  end

  should "match number" do
    params = [1]
    result = Match.build_match(params)
    expected_result = { 
      [JS.literal(1)],  
      []
    }

    assert result == expected_result
  end

  should "match struct pattern" do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], []}]}]
    result = Match.build_match(params)
    expected_result = { 
      [JS.object_expression([
        JS.property(JS.literal("__struct__"), Translator.translate(:Hello))
      ])],  
      []
    }

    assert result == expected_result
  end

  should "match struct pattern with property" do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: 1]}]}]
    result = Match.build_match(params)
    expected_result = { 
      [JS.object_expression([
        JS.property(JS.literal("__struct__"), Translator.translate(:Hello)),
        JS.property(Translator.translate(:key), Translator.translate(1))
      ])],  
      []
    }

    assert result == expected_result
  end

  should "match struct pattern with property param" do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: {:key, [], Elixir }]}]}]
    result = Match.build_match(params)
    expected_result = { 
      [JS.object_expression([
        JS.property(JS.literal("__struct__"), Translator.translate(:Hello)),
        JS.property(Translator.translate(:key), Match.parameter)
      ])],  
      [JS.identifier("key")]
    }

    assert result == expected_result
  end

  should "capture parameter when assigning it" do
    params = [{:=, [], [1, {:a, [], Elixir}]}]
    result = Match.build_match(params)
    expected_result = { 
      [Match.bind(JS.literal(1))],  
      [JS.identifier("a")]
    }

    assert result == expected_result


    params = [{:=, [], [{:a, [], Elixir}, 1]}]
    result = Match.build_match(params)
    expected_result = { 
      [Match.bind(JS.literal(1))],  
      [JS.identifier("a")]
    }

    assert result == expected_result


    params = [{:=, [], [{:%, [], [{:__aliases__, [alias: false], [:AStruct]}, {:%{}, [], []}]}, {:a, [], ElixirScript.Translator.Function.Test}]}]
    result = Match.build_match(params)
    expected_result = { 
      [Match.bind(JS.object_expression([
        JS.property(JS.literal("__struct__"), Translator.translate(:AStruct)),
      ]))],  
      [JS.identifier("a")]
    }

    assert result == expected_result   
  end

  should "match and assign list" do
    params = [{:=, [], [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}], {:d, [], Elixir}]}]
    result = Match.build_match(params)
    expected_result = { 
      [Match.bind(make_list([Match.parameter, Match.parameter, Match.parameter]))],  
      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c"), JS.identifier("d")]
    }

    assert result == expected_result
  end

  should "match on tuple" do
    params = [{:{}, [], [1, {:b, [], Elixir}, 3]}]
    result = Match.build_match(params)
    expected_result = { 
      [make_tuple([JS.literal(1), Match.parameter, JS.literal(3)])],  
      [JS.identifier("b")]
    }

    assert result == expected_result

    params = [{1, {:b, [], Elixir}}]
    result = Match.build_match(params)
    expected_result = { 
      [make_tuple([JS.literal(1), Match.parameter])],  
      [JS.identifier("b")]
    }

    assert result == expected_result
  end

end