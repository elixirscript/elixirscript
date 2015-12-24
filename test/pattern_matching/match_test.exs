defmodule ElixirScript.PatternMatching.Match.Test do
  use ShouldI
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.PatternMatching.Match
  alias ElixirScript.Translator.Map
  alias ESTree.Tools.Builder, as: JS

#  should "match wildcard" do
#    params = [{:_, [], Test}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = { [Match.wildcard],  [JS.identifier(:undefined)] }
#
#    assert result == expected_result
#  end
#
#  should "match one identifier param" do
#    params = [{:a, [], Test}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {[Match.parameter],  [JS.identifier("a")]}
#
#    assert result == expected_result
#  end
#
#  should "match multiple identifier params" do
#    params = [{:a, [], Test}, {:b, [], Test}, {:c, [], Test}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      List.duplicate(Match.parameter, 3),
#      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
#    }
#
#    assert result == expected_result
#  end
#
#  should "match head and tail param" do
#    params = [[{:|, [], [{:head, [], Elixir}, {:tail, [], Elixir}]}]]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.head_tail],
#      [JS.identifier("head"), JS.identifier("tail")]
#    }
#
#    assert result == expected_result
#  end
#
#  should "match prefix param" do
#    params = [{:<>, [context: Elixir, import: Elixir.Kernel], ["Bearer ", {:token, [], Elixir}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.starts_with("Bearer ")],
#      [JS.identifier("token")]
#    }
#
#    assert result == expected_result
#  end
#
#  should "match list" do
#    params = [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}]]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Primitive.make_list_no_translate(List.duplicate(Match.parameter, 3))],
#      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
#    }
#
#    assert result == expected_result
#  end
#
#  should "match list with a literal" do
#    params = [[1, {:b, [], Elixir}, {:c, [], Elixir}]]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Primitive.make_list_no_translate([JS.literal(1), Match.parameter, Match.parameter])],
#      [JS.identifier("b"), JS.identifier("c")]
#    }
#
#    assert result == expected_result
#  end
#
#  should "match number" do
#    params = [1]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [JS.literal(1)],
#      []
#    }
#
#    assert result == expected_result
#  end
#
#  should "match struct pattern" do
#    ElixirScript.State.start_link(nil, nil)
#
#    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], []}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.type(JS.identifier(:Hello), JS.object_expression([]))],
#      []
#    }
#
#    assert result == expected_result
#
#    ElixirScript.State.stop()
#  end
#
#  should "match struct pattern with property" do
#    ElixirScript.State.start_link(nil, nil)
#
#    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: 1]}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.type(JS.identifier(:Hello), JS.object_expression([
#          Map.make_property(Translator.translate!(:key, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") ), Translator.translate!(1, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") ))
#        ]))
#      ],
#      []
#    }
#
#    assert result == expected_result
#
#    ElixirScript.State.stop()
#  end
#
#  should "match struct pattern with property param" do
#    ElixirScript.State.start_link(nil, nil)
#
#    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: {:key, [], Elixir }]}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.type(JS.identifier(:Hello), JS.object_expression([
#          Map.make_property(Translator.translate!(:key, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") ), Match.parameter)
#        ]))
#      ],
#      [JS.identifier("key")]
#    }
#
#    assert result == expected_result
#
#    ElixirScript.State.stop()
#
#  end
#
#  should "capture parameter when assigning it" do
#    ElixirScript.State.start_link(nil, nil)
#
#    params = [{:=, [], [1, {:a, [], Elixir}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.capture(JS.literal(1))],
#      [JS.identifier("a")]
#    }
#
#    assert result == expected_result
#
#
#    params = [{:=, [], [{:a, [], Elixir}, 1]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.capture(JS.literal(1))],
#      [JS.identifier("a")]
#    }
#
#    assert result == expected_result
#
#
#    params = [{:=, [], [{:%, [], [{:__aliases__, [alias: false], [:AStruct]}, {:%{}, [], []}]}, {:a, [], ElixirScript.Translator.Function.Test}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.capture(Match.type(JS.identifier(:AStruct), JS.object_expression([])))],
#      [JS.identifier("a")]
#    }
#
#    assert result == expected_result
#
#    ElixirScript.State.stop()
#  end
#
#  should "match and assign list" do
#    params = [{:=, [], [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}], {:d, [], Elixir}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.capture(Primitive.make_list_no_translate([Match.parameter, Match.parameter, Match.parameter]))],
#      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c"), JS.identifier("d")]
#    }
#
#    assert result == expected_result
#  end
#
#  should "match on tuple" do
#    params = [{:{}, [], [1, {:b, [], Elixir}, 3]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.type(Primitive.tuple_class, JS.object_expression([JS.property(
#        JS.identifier("values"),
#        JS.array_expression([JS.literal(1), Match.parameter, JS.literal(3)])
#        ) ] )) ],
#      [JS.identifier("b")]
#    }
#
#    assert result == expected_result
#
#    params = [{1, {:b, [], Elixir}}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Match.type(Primitive.tuple_class, JS.object_expression([JS.property(
#        JS.identifier("values"),
#        JS.array_expression([JS.literal(1), Match.parameter])
#        ) ] )) ],
#      [JS.identifier("b")]
#    }
#
#    assert result == expected_result
#  end
#
#  should "match on map" do
#    params = [{:%{}, [], [which: 13]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#
#    expected_result = {
#      [JS.object_expression([
#              Map.make_property(Translator.translate!(:which, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") ), JS.literal(13))
#            ])],
#      []
#    }
#
#    assert result == expected_result
#  end
#
#
#  should "match on bound value" do
#    params = [{:^, [], [{:a, [], Elixir}]}]
#    result = Match.build_match(params, ElixirScript.Env.module_env(ElixirScript.Temp, "temp.ex") )
#
#    expected_result = {
#      [Match.bound(JS.identifier("a"))],
#      [nil]
#    }
#
#    assert result == expected_result
#  end

end
