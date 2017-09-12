defmodule ElixirScript.Translate.Forms.Receive do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.{Helpers, Form, Function, Clause}

  @doc """
  receive is not supported just yet, but we compile it
  to a stub function for now
  """
  def compile(blocks, state) do
    receive_block = blocks
    |> Keyword.get(:do)
    |> Enum.map(fn x ->
      Clause.compile(x, state)
      |> elem(0)
    end)
    |> List.flatten
    |> J.array_expression()

    receive_function = J.member_expression(
      Helpers.special_forms(),
      J.identifier("receive")
    )

    after_block = Keyword.get(blocks, :after, nil)
    args = [receive_block] ++ process_after(after_block, state)

    ast = Helpers.call(
      receive_function,
      args
    )

    { ast, state }
  end

  defp process_after(nil, _) do
    []
  end

  defp process_after([{:->, _, [[timeout], body]}], state) do
    timeout = Form.compile!(timeout, state)
    {body, _state} = Function.compile_block(body, state)

    function = Helpers.arrow_function(
      [],
      J.block_statement(List.wrap(body))
    )

    [timeout, function]
  end
end
