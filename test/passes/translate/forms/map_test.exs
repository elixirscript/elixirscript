defmodule ElixirScript.Translate.Forms.Map.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ESTree.Tools.Builder, as: J
  use ExUnitProperties

  setup_all do
    {:ok, pid} = ElixirScript.State.start_link(%{})

    state = %{
      pid: pid
    }

    [state: state]
  end

  property "maps convert to Map objects", %{state: state} do
    check all tuple <- StreamData.tuple({
      StreamData.one_of([
        StreamData.integer(),
        StreamData.boolean(),
        StreamData.binary(),
        StreamData.uniform_float()
      ]),
      StreamData.binary()
      }) do

      properties = [tuple]
      ast = {:%{}, [], properties}

      {js_ast, _} = Form.compile(ast, state)
      assert js_ast == J.new_expression(
        J.identifier("Map"),
        [
          J.array_expression([
            J.array_expression([
              J.literal(elem(tuple, 0)),
              J.literal(elem(tuple, 1)),
            ])
          ])
        ]
      )
    end
  end

  property "maps update converts to new Map objects using old version", %{state: state} do
    check all key <- StreamData.binary(),
              old_value <- StreamData.integer(),
              new_value <- StreamData.integer() do

      properties = [{key, old_value}]
      map_ast = {:%{}, [], properties}
      new_values = [{key, new_value}]

      ast = {:%{}, [], [{:|, [], [map_ast, new_values]}]}

      map_js_ast = J.new_expression(
        J.identifier("Map"),
        [
          J.array_expression([
            J.array_expression([
              J.literal(key),
              J.literal(old_value),
            ])
          ])
        ]
      )

      {js_ast, _} = Form.compile(ast, state)
      assert js_ast == J.new_expression(
        J.identifier("Map"),
        [
          J.array_expression(
            [J.spread_element(map_js_ast)] ++ [J.array_expression([
              J.literal(key),
              J.literal(new_value)
            ])]
          )
        ]
      )
    end
  end

end
