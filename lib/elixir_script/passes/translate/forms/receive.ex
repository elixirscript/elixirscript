defmodule ElixirScript.Translate.Forms.Receive do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Helpers

  @doc """
  receive is not supported just yet, but we compile it
  to a stub function for now
  """
  def compile(blocks, state) do
    _receive_block = Keyword.get(blocks, :do)
    _after_block = Keyword.get(blocks, :after, nil)

    receive_function = J.member_expression(
      Helpers.special_forms(),
      J.identifier("receive")
    )

    ast = Helpers.call(
      receive_function,
      []
    )

    { ast, state }
  end
end
