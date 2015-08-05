defmodule ElixirScript.Translator.PatternMatching.Test do
  use ShouldI
  import ElixirScript.TestHelper
  alias ElixirScript.Translator
  alias ElixirScript.Translator.NewPatternMatching
  alias ESTree.Tools.Builder, as: JS

  should "match one identifier param" do
    params = [{:a, [], Test}]
    result = NewPatternMatching.build_match(params)
    expected_result = {[NewPatternMatching.parameter],  [JS.identifier(:a)]}

    assert result == expected_result
  end

  should "match multiple identifier params" do
    params = [{:a, [], Test}, {:b, [], Test}, {:c, [], Test}]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      List.duplicate(NewPatternMatching.parameter, 3),  
      [JS.identifier(:a), JS.identifier(:b), JS.identifier(:c)]
    }

    assert result == expected_result
  end

  should "match head and tail param" do
    params = [[{:|, [], [{:head, [], Elixir}, {:tail, [], Elixir}]}]]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      [NewPatternMatching.headTail],  
      [JS.identifier("head"), JS.identifier("tail")]
    }

    assert result == expected_result
  end

  should "match prefix param" do
    params = [{:<>, [context: Elixir, import: Kernel], ["Bearer ", {:token, [], Elixir}]}]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      [NewPatternMatching.startsWith("Bearer ")],  
      [JS.identifier("token")]
    }

    assert result == expected_result
  end

  should "match list" do
    params = [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}]]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      List.duplicate(NewPatternMatching.parameter, 3),  
      [JS.identifier(:a), JS.identifier(:b), JS.identifier(:c)]
    }

    assert result == expected_result
  end

  should "match list with a literal" do
    params = [[1, {:b, [], Elixir}, {:c, [], Elixir}]]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      [JS.literal(1), NewPatternMatching.parameter, NewPatternMatching.parameter],  
      [JS.identifier(:b), JS.identifier(:c)]
    }

    assert result == expected_result
  end

  should "match number" do
    params = [1]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      [JS.literal(1)],  
      []
    }

    assert result == expected_result
  end

  should "match struct pattern" do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], []}]}]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      [JS.object_expression([
        JS.property(JS.literal("__struct__"), Translator.translate([:Hello]))
      ])],  
      []
    }

    assert result == expected_result
  end

  should "match struct pattern with property" do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: 1]}]}]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      [JS.object_expression([
        JS.property(JS.literal("__struct__"), Translator.translate([:Hello])),
        JS.property(Translator.translate(:key), Translator.translate(1))
      ])],  
      []
    }

    assert result == expected_result
  end

  should "match struct pattern with property param" do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: {:key, [], Elixir }]}]}]
    result = NewPatternMatching.build_match(params)
    expected_result = { 
      [JS.object_expression([
        JS.property(JS.literal("__struct__"), Translator.translate([:Hello])),
        JS.property(Translator.translate(:key), NewPatternMatching.parameter)
      ])],  
      [JS.identifier(:key)]
    }

    assert result == expected_result
  end

end