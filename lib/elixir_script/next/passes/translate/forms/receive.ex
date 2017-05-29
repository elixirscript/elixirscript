defmodule ElixirScript.Translate.Forms.Receive do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J

  def compile(blocks, state) do
    receive_block = Keyword.get(blocks, :do)
    after_block = Keyword.get(blocks, :after, nil)

    receive_function = J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.member_expression(
          J.identifier("Core"),
          J.identifier("SpecialForms")
        )
      ),
      J.identifier("receive")
    )

    J.call_expression(
      receive_function,
      []
    )

  end
end