defmodule ElixirScript.Translator.PatternMatching.Test do
  use ExUnit.Case
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Map
  alias ESTree.Tools.Builder, as: JS

#  test "match wildcard" do
#    params = [{:_, [], Test}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = { [PatternMatching.wildcard],  [JS.identifier(:undefined)] }
#
#    assert result == expected_result
#  end
#
#  test "match one identifier param" do
#    params = [{:a, [], Test}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {[PatternMatching.parameter],  [JS.identifier("a")]}
#
#    assert result == expected_result
#  end
#
#  test "match multiple identifier params" do
#    params = [{:a, [], Test}, {:b, [], Test}, {:c, [], Test}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      List.duplicate(PatternMatching.parameter, 3),
#      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
#    }
#
#    assert result == expected_result
#  end
#
#  test "match head and tail param" do
#    params = [[{:|, [], [{:head, [], Elixir}, {:tail, [], Elixir}]}]]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.head_tail],
#      [JS.identifier("head"), JS.identifier("tail")]
#    }
#
#    assert result == expected_result
#  end
#
#  test "match prefix param" do
#    params = [{:<>, [context: Elixir, import: Elixir.Kernel], ["Bearer ", {:token, [], Elixir}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.starts_with("Bearer ")],
#      [JS.identifier("token")]
#    }
#
#    assert result == expected_result
#  end
#
#  test "match list" do
#    params = [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}]]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Primitive.make_list_no_translate(List.duplicate(PatternMatching.parameter, 3))],
#      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
#    }
#
#    assert result == expected_result
#  end
#
#  test "match list with a literal" do
#    params = [[1, {:b, [], Elixir}, {:c, [], Elixir}]]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [Primitive.make_list_no_translate([JS.literal(1), PatternMatching.parameter, PatternMatching.parameter])],
#      [JS.identifier("b"), JS.identifier("c")]
#    }
#
#    assert result == expected_result
#  end
#
#  test "match number" do
#    params = [1]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [JS.literal(1)],
#      []
#    }
#
#    assert result == expected_result
#  end
#
#  test "match struct pattern" do
#    ElixirScript.Translator.State.start_link(nil, nil)
#
#    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], []}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.type(JS.identifier(:Hello), JS.object_expression([]))],
#      []
#    }
#
#    assert result == expected_result
#
#    ElixirScript.Translator.State.stop()
#  end
#
#  test "match struct pattern with property" do
#    ElixirScript.Translator.State.start_link(nil, nil)
#
#    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: 1]}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.type(JS.identifier(:Hello), JS.object_expression([
#          Map.make_property(Translator.translate!(:key, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") ), Translator.translate!(1, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") ))
#        ]))
#      ],
#      []
#    }
#
#    assert result == expected_result
#
#    ElixirScript.Translator.State.stop()
#  end
#
#  test "match struct pattern with property param" do
#    ElixirScript.Translator.State.start_link(nil, nil)
#
#    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: {:key, [], Elixir }]}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.type(JS.identifier(:Hello), JS.object_expression([
#          Map.make_property(Translator.translate!(:key, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") ), PatternMatching.parameter)
#        ]))
#      ],
#      [JS.identifier("key")]
#    }
#
#    assert result == expected_result
#
#    ElixirScript.Translator.State.stop()
#
#  end
#
#  test "capture parameter when assigning it" do
#    ElixirScript.Translator.State.start_link(nil, nil)
#
#    params = [{:=, [], [1, {:a, [], Elixir}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.capture(JS.literal(1))],
#      [JS.identifier("a")]
#    }
#
#    assert result == expected_result
#
#
#    params = [{:=, [], [{:a, [], Elixir}, 1]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.capture(JS.literal(1))],
#      [JS.identifier("a")]
#    }
#
#    assert result == expected_result
#
#
#    params = [{:=, [], [{:%, [], [{:__aliases__, [alias: false], [:AStruct]}, {:%{}, [], []}]}, {:a, [], ElixirScript.Translator.Function.Test}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.capture(PatternMatching.type(JS.identifier(:AStruct), JS.object_expression([])))],
#      [JS.identifier("a")]
#    }
#
#    assert result == expected_result
#
#    ElixirScript.Translator.State.stop()
#  end
#
#  test "match and assign list" do
#    params = [{:=, [], [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}], {:d, [], Elixir}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.capture(Primitive.make_list_no_translate([PatternMatching.parameter, PatternMatching.parameter, PatternMatching.parameter]))],
#      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c"), JS.identifier("d")]
#    }
#
#    assert result == expected_result
#  end
#
#  test "match on tuple" do
#    params = [{:{}, [], [1, {:b, [], Elixir}, 3]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.type(Primitive.tuple_class, JS.object_expression([JS.property(
#        JS.identifier("values"),
#        JS.array_expression([JS.literal(1), PatternMatching.parameter, JS.literal(3)])
#        ) ] )) ],
#      [JS.identifier("b")]
#    }
#
#    assert result == expected_result
#
#    params = [{1, {:b, [], Elixir}}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#    expected_result = {
#      [PatternMatching.type(Primitive.tuple_class, JS.object_expression([JS.property(
#        JS.identifier("values"),
#        JS.array_expression([JS.literal(1), PatternMatching.parameter])
#        ) ] )) ],
#      [JS.identifier("b")]
#    }
#
#    assert result == expected_result
#  end
#
#  test "match on map" do
#    params = [{:%{}, [], [which: 13]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#
#    expected_result = {
#      [JS.object_expression([
#              Map.make_property(Translator.translate!(:which, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") ), JS.literal(13))
#            ])],
#      []
#    }
#
#    assert result == expected_result
#  end
#
#
#  test "match on bound value" do
#    params = [{:^, [], [{:a, [], Elixir}]}]
#    result = PatternMatching.build_match(params, ElixirScript.Translator.Env.module_env(ElixirScript.Temp, "temp.ex") )
#
#    expected_result = {
#      [PatternMatching.bound(JS.identifier("a"))],
#      [nil]
#    }
#
#    assert result == expected_result
#  end

end
