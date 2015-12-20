defmodule ElixirScript.Translator.Map do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive

  def make_map(object_expression) do
    JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier("map")
      ),
      [object_expression]
    )
  end

  def make_get_property(target, property, env) do
    JS.member_expression(
      Translator.translate!(target, env),
      Translator.translate!(property, env),
      true
    )
  end

  def make_object(properties, env) do
    properties
    |> Enum.map(fn
      ({x, {:__aliases__, _, [value]}}) -> make_property(Translator.translate!(x, env), JS.identifier(value))
      ({x, y}) -> make_property(Translator.translate!(x, env), Translator.translate!(y, env))
    end)
    |> JS.object_expression
    |> make_map
  end

  def make_property(%ESTree.Identifier{} = key, value) do
    JS.property(key, value)
  end

  def make_property(%ESTree.Literal{value: k}, value) when is_binary(k) do
    JS.property(JS.identifier(k), value)
  end

  def make_property(key, value) do
    JS.property(key, value, :init, false, false, true)
  end

  def make_shorthand_property(%ESTree.Identifier{} = key) do
    JS.property(key, key, :init, true)
  end

  def make_map_update(map, data, env) do
    map = Translator.translate!(map, env)

    map_update = JS.object_expression(
      Enum.map(data,
        fn({key, value}) ->
          make_property(Translator.translate!(key, env), Translator.translate!(value, env))
        end
      )
    )

    JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier("map_update")
      ),
      [map, map_update]
    )
  end

end
