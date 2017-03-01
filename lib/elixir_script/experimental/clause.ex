defmodule Elixirscript.Experimental.Clause do
  alias ESTree.Tools.Builder, as: J 

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
  end

  def compile({ _, args, guards, body}) do
  end
end
