defmodule ElixirScript.Experimental.Clause do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form 

  @patterns J.member_expression(
    J.member_expression(
      J.identifier("Bootstrap"),
      J.identifier("Core")
    ),
    J.identifier("Patterns")
  )

  def compile({ _, [], [], nil}) do
    J.call_expression(
      J.member_expression(
        @patterns,
        J.identifier("clause")
      ),
      [
        J.array_expression([]),
        J.function_expression(
          [], 
          [], 
          J.block_statement([
            J.return_statement(J.identifier("null"))
          ])
        )
      ]
    )
  end

  def compile({ _, args, guards, {:__block__, _, body}}) do
    body = Enum.map(body, &Form.compile(&1))
    |> List.flatten

    J.call_expression(
      J.member_expression(
        @patterns,
        J.identifier("clause")
      ),
      [
        J.array_expression([]),
        J.function_expression(
          [], 
          [], 
          J.block_statement(body)
        )
      ]
    )
  end

  def compile({ _, args, guards, body}) do
  end
end
