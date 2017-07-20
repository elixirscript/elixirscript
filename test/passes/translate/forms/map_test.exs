defmodule ElixirScript.Translate.Forms.Map.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ESTree.Tools.Builder, as: J

  test "map with atom key" do
    properties = [a: 1]
    ast = {:%{}, [], properties}
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.new_expression(
      J.identifier("Map"),
      [
        J.array_expression([
          J.array_expression([
              J.call_expression(
                J.member_expression(
                  J.identifier("Symbol"),
                  J.identifier("for")
                ),
                [J.literal(:a)]
              ),
              J.literal(1),
          ])
        ])
      ]
    )
  end

  test "map with string key" do
    properties = [{"a", 1}]
    ast = {:%{}, [], properties}
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.new_expression(
      J.identifier("Map"),
      [
        J.array_expression([
          J.array_expression([
            J.literal("a"),
            J.literal(1),
          ])
        ])
      ]
    )
  end


  test "map update" do
    properties = [{"a", 1}]
    map_ast = {:%{}, [], properties}
    new_values = [{"a", 2}]
    state = %{}

    ast = {:%{}, [], [{:|, [], [map_ast, new_values]}]}

    map_ast = J.new_expression(
      J.identifier("Map"),
      [
        J.array_expression([
          J.array_expression([
            J.literal("a"),
            J.literal(1),
          ])
        ])
      ]
    )

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.new_expression(
      J.identifier("Map"),
      [
        J.array_expression(
          [J.spread_element(map_ast)] ++ [J.array_expression([
            J.literal("a"),
            J.literal(2)
          ])]
        )
      ]
    )
  end

end
