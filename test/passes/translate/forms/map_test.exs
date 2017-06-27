defmodule ElixirScript.Translate.Forms.Map.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ESTree.Tools.Builder, as: J

  test "map with atom key" do
    properties = [a: 1]
    ast = {:%{}, [], properties}
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.object_expression([
      J.property(
        J.call_expression(
          J.member_expression(
            J.identifier("Symbol"),
            J.identifier("for")
          ),
          [J.literal(:a)]
        ),
        J.literal(1),
        :init, false, false, true      
      )
    ])
  end

  test "map with string key" do
    properties = [{"a", 1}]
    ast = {:%{}, [], properties}
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.object_expression([
      J.property(
        J.identifier("a"),
        J.literal(1)  
      )
    ])
  end


  test "map update" do
    properties = [{"a", 1}]
    map_ast = {:%{}, [], properties}
    new_values = [{"a", 2}]
    state = %{}

    ast = {:%{}, [], [{:|, [], [map_ast, new_values]}]}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      J.member_expression(
        J.identifier("Object"),
        J.identifier("assign")
      ),
      [
        J.object_expression([]),
        J.object_expression([
              J.property(
                J.identifier("a"),
                J.literal(1)  
              )
            ]),
        J.object_expression([
              J.property(
                J.identifier("a"),
                J.literal(2)  
              )
            ])        
      ]
    )
  end

end