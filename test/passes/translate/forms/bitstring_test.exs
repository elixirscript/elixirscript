defmodule ElixirScript.Translate.Forms.Bitstring.Test do
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

  test "string interpolation", %{state: state} do
    ast = {:<<>>, [line: 5],
      [{:::, [], ["Hello, ", {:binary, [], []}]},
        {:::, [line: 5],
        [{{:., [line: 5], [String.Chars, :to_string]}, [line: 5],
          [{:name, [line: 5], nil}]}, {:binary, [], []}]}]}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast.type == "BinaryExpression"
    assert js_ast.left == J.literal("Hello, ")
    assert js_ast.right.type == "CallExpression"
  end

end