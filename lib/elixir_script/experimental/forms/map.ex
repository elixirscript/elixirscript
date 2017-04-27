defmodule ElixirScript.Experimental.Forms.Map do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form

  def compile({:%{}, _, [{:|, _, [map, new_values]}]}, state) do
    map = Form.compile(map, state)
    data = Form.compile({:%{}, [], new_values}, state)

    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.member_expression(
            J.identifier("Core"),
            J.identifier("SpecialForms")
          )
        ),
        J.identifier("map_update")
      ),
      [map, data]
    )
  end

  def compile({:%{}, _, properties}, state) do
    properties
    |> Enum.map(fn
      ({x, y}) ->
        case x do
          {_, _, nil } ->
            J.property(Form.compile(x, state),  Form.compile(y, state), :init, false, false, true)
          _ ->
            make_property(Form.compile(x, state), Form.compile(y, state))
        end
    end)
    |> J.object_expression
  end

  def make_property(%ESTree.Identifier{} = key, value) do
    J.property(key, value)
  end

  def make_property(%ESTree.Literal{value: k}, value) when is_binary(k) do
    key = case String.contains?(k, "-") do
      true ->
        J.literal(k)
      false ->
        ElixirScript.Translator.Identifier.make_identifier(k)
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
