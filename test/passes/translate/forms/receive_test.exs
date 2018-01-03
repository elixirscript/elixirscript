defmodule ElixirScript.Translate.Forms.Receive.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.{Form, Helpers}
  alias ESTree.Tools.Builder, as: J

  setup_all do
    {:ok, pid} = ElixirScript.State.start_link(%{})

    state = %{
      pid: pid,
      module: __MODULE__
    }

    [state: state]
  end

  test "receive translation", %{state: state} do
    clause = {:->, [line: 644], [[], [{:__block__, [], [1]}]]}
    ast = {:receive, [line: 644], [[do: [clause], after: nil]]}

    state =
      state
      |> Map.put(:function, {:each, nil})
      |> Map.put(:anonymous_fn, false)

    {js_ast, _} = Form.compile(ast, state)

    assert js_ast.callee ==
             J.member_expression(
               Helpers.special_forms(),
               J.identifier("receive")
             )
  end
end
