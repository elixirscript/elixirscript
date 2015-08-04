defmodule ElixirScript.Translator.PatternMatching.Test do
  use ShouldI
  import ElixirScript.TestHelper
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
end