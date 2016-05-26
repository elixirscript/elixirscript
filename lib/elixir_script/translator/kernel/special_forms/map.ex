defmodule ElixirScript.Translator.Map do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive

  def make_map(object_expression) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:Object),
        JS.identifier(:freeze)
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
      ({x, y}) ->
        case x do
          {_, _, atom } when is_atom(atom) ->
            JS.property(Translator.translate!(x, env),  Translator.translate!(y, env), :init, false, false, true)
          _ ->
            make_property(Translator.translate!(x, env), Translator.translate!(y, env))
        end
    end)
    |> JS.object_expression
    |> make_map
  end

  def make_property(%ESTree.Identifier{} = key, value) do
    JS.property(key, value)
  end

  def make_property(%ESTree.Literal{value: k}, value) when is_binary(k) do
    key = case String.contains?(k, "-") do
      true ->
        JS.literal(k)
      false ->
        JS.identifier(k)
    end

    JS.property(key, value)
  end

  def make_property(key, value) do
    JS.property(key, value, :init, false, false, true)
  end

  def make_shorthand_property(%ESTree.Identifier{} = key) do
    JS.property(key, key, :init, true)
  end

  def make_map_update(map, data, env) do
    map = Translator.translate!(map, env)
    data = Translator.translate!({:%{}, [], data}, env)

    js_ast = JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier("map_update")
      ),
      [map, data]
    )

    { js_ast, env }
  end

end
