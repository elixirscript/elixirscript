defmodule ElixirScript.Translate.Clause do
  @moduledoc false

  # Handles translation of all of the clause ASTs

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Helpers
  alias ElixirScript.Translate.Form
  alias ElixirScript.Translate.Forms.Pattern
  alias ElixirScript.Translate.Function

  def compile({ _, args, guards, body}, state) do
    {patterns, params, state} = Pattern.compile(args, state)
    guard = compile_guard(params, guards, state)

    {body, _state} = Function.compile_block(body, state)

    body = body
    |> return_last_statement

    ast = Helpers.call(
      J.member_expression(
        Helpers.patterns(),
        J.identifier("clause")
      ),
      [
        J.array_expression(patterns),
        Helpers.arrow_function(
          params,
          J.block_statement(body)
        ),
        guard
      ]
    )

    { ast, state }
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

  defp do_return_last_statement([%ESTree.VariableDeclaration{} = head | tail]) do
    declaration = hd(head.declarations).id

    return_statement = case declaration do
      %ESTree.ArrayPattern{elements: elements} ->
        if length(elements) == 1 do
          J.return_statement(hd(declaration.elements))
        else
          J.return_statement(J.array_expression(declaration.elements))
        end
      _ ->
        J.return_statement(declaration)
    end

    [return_statement, head] ++ tail
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
    state = Map.put(state, :in_guard, true)

    guards = guards
    |> List.wrap
    |> Enum.reverse
    |> process_guards
    |> Form.compile!(state)

    Helpers.arrow_function(
      params,
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
