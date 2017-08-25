defmodule ElixirScript.Translate.Forms.Map do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.{Form, Helpers}

  def compile({:%{}, _, [{:|, _, [map, new_values]}]}, state) do
    { map, state } = Form.compile(map, state)
    data = Enum.map(new_values, fn {x, y} ->
      J.array_expression([
        Form.compile!(x, state),
        Form.compile!(y, state)
      ])
    end)

    ast = Helpers.new(
      J.identifier("Map"),
      [
        J.array_expression(
          [J.spread_element(map)] ++ data
        )
      ]
    )

    { ast, state }
  end

  def compile({:%{}, _, properties}, state) do
    ast = Helpers.new(
      J.identifier("Map"),
      [
        J.array_expression(
          Enum.map(properties, fn
            {x, y} ->
              J.array_expression(
                [
                  Form.compile!(x, state),
                  Form.compile!(y, state)
                ]
              )
          end)
        )
      ]
    )

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
