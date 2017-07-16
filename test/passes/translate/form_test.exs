defmodule ElixirScript.Translate.Forms.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ElixirScript.Translate.Identifier
  alias ESTree.Tools.Builder, as: J


  setup_all do
    {:ok, pid} = ElixirScript.State.start_link(%{})

    state = %{
      pid: pid
    }

    [state: state]
  end

  test "integer" do
    ast = 1
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.literal(1)
  end

  test "boolean" do
    ast = true
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.literal(true)
  end

  test "float" do
    ast = 1.0
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.literal(1.0)
  end

  test "binary" do
    ast = "hello"
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.literal("hello")
  end

  test "atom" do
    ast = :tiger
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
        J.member_expression(
          J.identifier("Symbol"),
          J.identifier("for")
        ),
        [J.literal(:tiger)]
      )
  end

  test "module", %{state: state} do
    ast = IO

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
          Identifier.make_namespace_members(["Elixir", "IO", "__load"]),
          [J.identifier("Elixir")]
        )
  end

  test "tuple" do
    ast = {1, 2}
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.new_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("ElixirScript"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      [J.literal(1), J.literal(2)]
    )
  end

  test "list" do
    ast = [1, 2]
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.array_expression([J.literal(1), J.literal(2)])
  end

  test "super" do
    ast =   {:super, [], [{:def, :my_function}, 1]}
    state = %{function: {:my_function, nil}, vars: %{}}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      J.identifier("my_function"),
      [J.literal(1)]
    )
  end

  test "local function" do
    ast = {:my_function, [], [1]}
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      J.identifier("my_function"),
      [J.literal(1)]
    )
  end

  test "function returning an array" do
    ast = {:fn, [], [{:foo, [], [], [1, 2, 3]}]}
    state = %{}

    {js_ast, _} = Form.compile(ast, state)
    return_statement = Enum.at(Enum.at(js_ast.body.body, 1).consequent.body, 1)

    assert return_statement.argument == J.array_expression([
      J.literal(1),
      J.literal(2),
      J.literal(3)
    ])
  end
end
