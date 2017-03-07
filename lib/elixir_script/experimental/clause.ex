defmodule ElixirScript.Experimental.Clause do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Experimental.Forms.Pattern

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

  def compile({ _, args, guards, body}) do
    {patterns, params} = Pattern.compile(args)
    guard = compile_guard(params, guards)

    body = case body do
      nil ->
        J.identifier("null")
      {:__block__, _, block_body} ->
        Enum.map(block_body, &Form.compile(&1))
        |> List.flatten
      _ ->
        Form.compile(body)
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

  def compile({:->, _, [[{:when, _, params}], body ]}) do
    guards = List.last(params)
    params = params |> Enum.reverse |> tl |> Enum.reverse

    compile({[], params, guards, body})
  end

  def compile({:->, _, [params, body]}) do
    compile({[], params, [], body})
  end

  def return_last_statement(body) do
    body
    |> List.wrap
    |> Enum.reverse
    |> do_return_last_statement
    |> Enum.reverse
  end

  defp do_return_last_statement([head]) do
    [J.return_statement(head)]
  end

  defp do_return_last_statement([head | tail]) do
    [J.return_statement(head)] ++ tail
  end

  defp compile_guard(params, guards) do

    guards = guards
    |> List.wrap
    |> Enum.reverse
    |> process_guards
    |> Form.compile

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
