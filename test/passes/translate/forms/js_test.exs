defmodule ElixirScript.Translate.Forms.JS.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ESTree.Tools.Builder, as: J

  setup_all do
    {:ok, pid} = ElixirScript.State.start_link(%{})

    state = %{
      pid: pid,
      vars: %{}
    }

    [state: state]
  end

  test "debugger" do
    ast = {{:., [], [JS, :debugger]}, [], []}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.debugger_statement()
  end

  test "this" do
    ast = {{:., [], [JS, :this]}, [], []}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.this_expression()
  end

  test "new" do
    ast = {{:., [], [JS, :new]}, [], [BLT, ["bacon", "lettuce", "tomato"]]}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.new_expression(
      J.identifier("BLT"),
      [
        J.literal("bacon"),
        J.literal("lettuce"),
        J.literal("tomato")
      ]
    )
  end


  test "throw" do
    ast = {{:., [], [JS, :throw]}, [], [1]}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.throw_statement(J.literal(1))
  end

  test "import" do
    ast = {{:., [], [JS, :import]}, [], ["react"]}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      J.identifier("import"),
      [J.literal("react")]
    )
  end

  test "global function or property" do
    ast = {{:., [], [JS, :self]}, [], []}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      ElixirScript.Translate.Forms.JS.call_property(),
      [
        ElixirScript.Translate.Forms.JS.global(),
        J.literal("self")
      ]
    )
  end

  test "global function with params" do
    ast = {{:., [], [JS, :self]}, [], ["something"]}
    state = %{function: {:each, nil}, module: Enum, vars: %{:_ => 0, "entry" => 0, "enumerable" => 0, "fun" => 0}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      J.identifier(:self),
      [J.literal("something")]
    )
  end

  test "JavaScript module call", %{state: state} do
    ast = {{:., [], [JS.Object, :keys]}, [], [{:obj, [], nil}]}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      J.member_expression(
        J.identifier("Object"),
        J.identifier("keys")
      ),
      [J.identifier("obj")]
    )
  end
end