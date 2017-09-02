defmodule ElixirScript.Translate.Forms.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ElixirScript.Translate.Identifier
  alias ESTree.Tools.Builder, as: J
  require StreamData
  import PropertyTest


  setup_all do
    {:ok, pid} = ElixirScript.State.start_link()

    state = %{
      pid: pid
    }

    [state: state]
  end

  property "integers, floats, binaries, and booleans translates to a literal JavaScript AST node", %{state: state} do
    check all value <- StreamData.one_of([
        StreamData.int(),
        StreamData.boolean(),
        StreamData.binary(),
        StreamData.uniform_float()
      ]) do
      {js_ast, _} = Form.compile(value, state)
      assert js_ast == J.literal(value)
    end
  end

  property "atom translates to Symbol.for call", %{state: state} do
    check all atom <- StreamData.unquoted_atom() do
      {js_ast, _} = Form.compile(atom, state)
      assert js_ast == J.call_expression(
        J.member_expression(
          J.identifier("Symbol"),
          J.identifier("for")
        ),
        [J.literal(atom)]
      )
    end
  end

  property "tuple translates to new Tuple object", %{state: state} do
    check all tuple <- StreamData.tuple({StreamData.int(), StreamData.binary()}) do
      {js_ast, _} = Form.compile(tuple, state)
      assert js_ast == J.new_expression(
        J.member_expression(
          J.member_expression(
            J.identifier("ElixirScript"),
            J.identifier("Core")
          ),
          J.identifier("Tuple")
        ),
        [J.literal(elem(tuple, 0)), J.literal(elem(tuple, 1))]
      )
    end
  end

  property "list translates to a JavaScript Array", %{state: state} do
    check all list <- StreamData.list_of(StreamData.binary()) do
      {js_ast, _} = Form.compile(list, state)
      assert js_ast.type == "ArrayExpression"
      assert length(js_ast.elements) == length(list)

      Enum.zip(js_ast.elements, list)
      |> Enum.each(fn {ast, original} ->
        assert ast == J.literal(original)
      end)
    end
  end

  property "local function call translates to local JavaScript function call", %{state: state} do
    check all func <- StreamData.filter(StreamData.unquoted_atom(), fn(x) -> not(x in [:fn]) end),
              params <- StreamData.list_of(StreamData.binary()) do

      ast = {func, [], params}

      str_func = if func in ElixirScript.Translate.Identifier.js_reserved_words() do
        "__#{to_string(func)}__"
      else
        to_string(func)
      end

      {js_ast, _} = Form.compile(ast, state)
      assert js_ast.type == "CallExpression"
      assert length(js_ast.arguments) == length(params)
      assert js_ast.callee.type == "Identifier"
      assert js_ast.callee.name == str_func

      Enum.zip(js_ast.arguments, params)
      |> Enum.each(fn {ast, original} ->
        assert ast == J.literal(original)
      end)
    end
  end

  property "super function call translates to local JavaScript function call" do
    check all func <- StreamData.unquoted_atom(),
              params <- StreamData.list_of(StreamData.binary()) do

      ast = {:super, [], [{:def, func}] ++ params}
      state = %{function: {func, nil}, vars: %{}}

      str_func = if func in ElixirScript.Translate.Identifier.js_reserved_words() do
        "__#{to_string(func)}__"
      else
        to_string(func)
      end

      {js_ast, _} = Form.compile(ast, state)
      assert js_ast.type == "CallExpression"
      assert length(js_ast.arguments) == length(params)
      assert js_ast.callee.type == "Identifier"
      assert js_ast.callee.name == str_func

      Enum.zip(js_ast.arguments, params)
      |> Enum.each(fn {ast, original} ->
        assert ast == J.literal(original)
      end)
    end
  end

  test "module", %{state: state} do
    ast = IO

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
          Identifier.make_namespace_members(["Elixir", "IO", "__load"]),
          [J.identifier("Elixir")]
        )
  end

  test "function returning an array" do
    ast = {:fn, [], [{:foo, [], [], [1, 2, 3]}]}
    state = %{function: {:something, nil}}

    {js_ast, _} = Form.compile(ast, state)

    return_statement = Enum.at(Enum.at(hd(js_ast.body.body).body.body, 1).consequent.body, 1)

    assert return_statement.argument == J.array_expression([
      J.literal(1),
      J.literal(2),
      J.literal(3)
    ])
  end
end
