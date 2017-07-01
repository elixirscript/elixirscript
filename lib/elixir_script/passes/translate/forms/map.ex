defmodule ElixirScript.Translate.Forms.Map do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form

  def compile({:%{}, _, [{:|, _, [map, new_values]}]}, state) do
    { map, state } = Form.compile(map, state)
    { data, state } = Form.compile({:%{}, [], new_values}, state)

    ast = J.call_expression(
      J.member_expression(
        J.identifier("Object"),
        J.identifier("assign")
      ),
      [
        J.object_expression([]),
        map,
        data
      ]
    )

    { ast, state }
  end

  def compile({:%{}, _, properties}, state) do
    ast = properties
    |> Enum.map(fn
      ({x, y}) ->
        case x do
          {_, _, nil } ->
            {key, _} = Form.compile(x, state)
            {value, _} = Form.compile(y, state)
            J.property(key,  value, :init, false, false, true)
          _ ->
            {key, _} = Form.compile(x, state)
            {value, _} = Form.compile(y, state)
            make_property(key, value)
        end
    end)
    |> J.object_expression

    {ast, state}
  end

  def make_property(%ESTree.Identifier{} = key, value) do
    J.property(key, value)
  end

  def make_property(%ESTree.Literal{value: k}, value) when is_binary(k) do
    key = case String.contains?(k, "-") do
      true ->
        J.literal(k)
      false ->
        ElixirScript.Translate.Identifier.make_identifier(k)
    end

    J.property(key, value)
  end

  def make_property(key, value) do
    J.property(key, value, :init, false, false, true)
  end

  def make_shorthand_property(%ESTree.Identifier{} = key) do
    J.property(key, key, :init, true)
  end

end
