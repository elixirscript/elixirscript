defmodule ElixirScript.Translate.Forms.Receive.Test do
  use ExUnit.Case
  alias ElixirScript.Translate.Form
  alias ESTree.Tools.Builder, as: J

  test "receive translation" do
    ast = {:receive, [line: 644], [[do: 1, after: 2]]}
    state = %{function: {:each, nil}, module: __MODULE__}

    {js_ast, _} = Form.compile(ast, state)
    assert js_ast == J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("ElixirScript"),
          J.member_expression(
            J.identifier("Core"),
            J.identifier("SpecialForms")
          )
        ),
        J.identifier("receive")
      ),
      []
    )
  end

end
