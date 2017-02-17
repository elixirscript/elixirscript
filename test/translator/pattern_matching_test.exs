defmodule ElixirScript.Translator.PatternMatching.Test do
  use ExUnit.Case
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Map
  alias ESTree.Tools.Builder, as: JS

  @std_lib_state File.read!(File.cwd!() <> "/lib/elixir_script/translator/stdlib_state.bin")

  setup do
    {:ok, pid} = ElixirScript.Translator.State.start_link(%{env: __ENV__}, [])
    ElixirScript.Translator.State.deserialize(pid, @std_lib_state)
    scope = ElixirScript.Translator.LexicalScope.module_scope(ElixirScript.Temp, "temp.ex", __ENV__, pid)

    {:ok, [scope: scope]}
  end

  test "match wildcard", %{scope: scope} do
    params = [{:_, [], Test}]
    result = PatternMatching.build_match(params, scope)
    expected_result = {[PatternMatching.wildcard],  [JS.identifier(:undefined)]}

    assert result == expected_result
  end

  test "match one identifier param", %{scope: scope} do
    params = [{:a, [], Test}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {[PatternMatching.parameter],  [JS.identifier("a")]}

    assert result == expected_result
  end

  test "match multiple identifier params", %{scope: scope} do
    params = [{:a, [], Test}, {:b, [], Test}, {:c, [], Test}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      List.duplicate(PatternMatching.parameter, 3),
      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
  }

    assert result == expected_result
  end

  test "match head and tail param", %{scope: scope} do
    params = [[{:|, [], [{:head, [], Elixir}, {:tail, [], Elixir}]}]]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.head_tail(PatternMatching.parameter, PatternMatching.parameter)],
      [JS.identifier("head"), JS.identifier("tail")]
  }

    assert result == expected_result
  end

  test "match prefix param", %{scope: scope} do
    params = [{:<>, [context: Elixir, import: Elixir.Kernel], ["Bearer ", {:token, [], Elixir}]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.starts_with("Bearer ")],
      [JS.identifier("token")]
  }

    assert result == expected_result
  end

  test "match list", %{scope: scope} do
    params = [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}]]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [Primitive.make_list_no_translate(List.duplicate(PatternMatching.parameter, 3))],
      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c")]
  }

    assert result == expected_result
  end

  test "match list with a literal", %{scope: scope} do
    params = [[1, {:b, [], Elixir}, {:c, [], Elixir}]]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [Primitive.make_list_no_translate([JS.literal(1), PatternMatching.parameter, PatternMatching.parameter])],
      [JS.identifier("b"), JS.identifier("c")]
  }

    assert result == expected_result
  end

  test "match number", %{scope: scope} do
    params = [1]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [JS.literal(1)],
      []
  }

    assert result == expected_result
  end

  test "match struct pattern", %{scope: scope} do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], []}]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.type(JS.identifier("Hello"), JS.object_expression([]))],
      []
  }

    assert result == expected_result
  end

  test "match struct pattern with property", %{scope: scope} do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: 1]}]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.type(JS.identifier("Hello"), JS.object_expression([
              Map.make_property(Translator.translate!(:key, scope ), Translator.translate!(1, scope ))
        ]))
      ],
      []
  }

    assert result == expected_result
  end

  test "match struct pattern with property param", %{scope: scope} do
    params = [{:%, [], [{:__aliases__, [alias: false], [:Hello]}, {:%{}, [], [key: {:key, [], Elixir}]}]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.type(JS.identifier("Hello"), JS.object_expression([
              Map.make_property(Translator.translate!(:key, scope ), PatternMatching.parameter)
        ]))
      ],
      [JS.identifier("key")]
  }

    assert result == expected_result
  end

  test "capture parameter when assigning it", %{scope: scope} do
    params = [{:=, [], [1, {:a, [], Elixir}]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.capture(JS.literal(1))],
      [JS.identifier("a")]
  }

    assert result == expected_result


    params = [{:=, [], [{:a, [], Elixir}, 1]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.capture(JS.literal(1))],
      [JS.identifier("a")]
  }

    assert result == expected_result


    params = [{:=, [], [{:%, [], [{:__aliases__, [alias: false], [:AStruct]}, {:%{}, [], []}]}, {:a, [], ElixirScript.Translator.Function.Test}]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.capture(PatternMatching.type(JS.identifier("AStruct"), JS.object_expression([])))],
      [JS.identifier("a")]
  }

    assert result == expected_result
  end

  test "match and assign list", %{scope: scope} do
    params = [{:=, [], [[{:a, [], Elixir}, {:b, [], Elixir}, {:c, [], Elixir}], {:d, [], Elixir}]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.capture(Primitive.make_list_no_translate([PatternMatching.parameter, PatternMatching.parameter, PatternMatching.parameter]))],
      [JS.identifier("a"), JS.identifier("b"), JS.identifier("c"), JS.identifier("d")]
  }

    assert result == expected_result
  end

  test "match on tuple", %{scope: scope} do
    params = [{:{}, [], [1, {:b, [], Elixir}, 3]}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.type(Primitive.tuple_class, JS.object_expression([JS.property(
        JS.identifier("values"),
        JS.array_expression([JS.literal(1), PatternMatching.parameter, JS.literal(3)])
        ) ] )) ],
      [JS.identifier("b")]
  }

    assert result == expected_result

    params = [{1, {:b, [], Elixir}}]
    result = PatternMatching.build_match(params, scope )
    expected_result = {
      [PatternMatching.type(Primitive.tuple_class, JS.object_expression([JS.property(
        JS.identifier("values"),
        JS.array_expression([JS.literal(1), PatternMatching.parameter])
        ) ] )) ],
      [JS.identifier("b")]
  }

    assert result == expected_result
  end

  test "match on map", %{scope: scope} do
    params = [{:%{}, [], [which: 13]}]
    result = PatternMatching.build_match(params, scope )

    expected_result = {
      [JS.object_expression([
          Map.make_property(Translator.translate!(:which, scope ), JS.literal(13))
            ])],
      []
  }

    assert result == expected_result
  end


  test "match on bound value", %{scope: scope} do
    params = [{:^, [], [{:a, [], Elixir}]}]
    result = PatternMatching.build_match(params, scope )

    expected_result = {
      [PatternMatching.bound(JS.identifier("a"))],
      [nil]
  }

    assert result == expected_result
  end

end
