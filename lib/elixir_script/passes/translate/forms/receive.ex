defmodule ElixirScript.Translate.Forms.Receive do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J

  @doc """
  receive is not supported just yet, but we compile it
  to a stub function for now
  """
  def compile(blocks, state) do
    _receive_block = Keyword.get(blocks, :do)
    _after_block = Keyword.get(blocks, :after, nil)

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

    ast = J.call_expression(
      receive_function,
      []
    )

    { ast, state }
  end
end
