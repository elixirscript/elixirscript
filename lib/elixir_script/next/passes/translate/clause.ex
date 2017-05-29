defmodule ElixirScript.Translate.Clause do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form
  alias ElixirScript.Translate.Forms.Pattern

  @moduledoc """
  Handles translation of all of the clause ASTs
  """

  @patterns J.member_expression(
    J.member_expression(
      J.identifier("Bootstrap"),
      J.identifier("Core")
    ),
    J.identifier("Patterns")
  )

  def compile({ _, args, guards, body}, state) do
    {patterns, params} = Pattern.compile(args, state)
    guard = compile_guard(params, guards, state)

    body = case body do
      nil ->
        J.identifier("null")
      {:__block__, _, block_body} ->
        Enum.map(block_body, &Form.compile(&1, state))
        |> List.flatten
      b when is_list(b) ->
        Enum.map(b, &Form.compile(&1, state))
        |> List.flatten
      _ ->
        Form.compile(body, state)
    end

    body = return_last_statement(body)

    J.call_expression(
      J.member_expression(
        @patterns,
        J.identifier("clause")
      ),
      [
        J.array_expression(patterns),
        J.function_expression(
          params,
          [],
          J.block_statement(body)
        ),
        guard
      ]
    )
  end

  def compile({:->, _, [[{:when, _, params}], body ]}, state) do
    guards = List.last(params)
    params = params |> Enum.reverse |> tl |> Enum.reverse

    compile({[], params, guards, body}, state)
  end

  def compile({:->, _, [params, body]}, state) do
    compile({[], params, [], body}, state)
  end

  def return_last_statement(body) do
    body
    |> List.wrap
    |> Enum.reverse
    |> do_return_last_statement
    |> Enum.reverse
  end

  defp do_return_last_statement([%ESTree.ThrowStatement{} = ast]) do
    [ast]
  end

  defp do_return_last_statement([head]) do
    [J.return_statement(head)]
  end

  defp do_return_last_statement([%ESTree.ThrowStatement{} = head | tail]) do
    [head] ++ tail
  end

  defp do_return_last_statement([head | tail]) do
    [J.return_statement(head)] ++ tail
  end

  defp do_return_last_statement([]) do
    [J.return_statement(J.identifier("null"))]
  end

  def compile_guard(params, guards, state) do

    guards = guards
    |> List.wrap
    |> Enum.reverse
    |> process_guards
    |> Form.compile(state)

    J.function_expression(
      params,
      [],
      J.block_statement([
            J.return_statement(guards)
          ])
    )

  end

  defp process_guards([]) do
    true
  end

  defp process_guards([guard]) do
    guard
  end

  defp process_guards([head | tail]) do
    {{:., [], [:erlang, :orelse]}, [], [process_guards(tail), head]}
  end
end
