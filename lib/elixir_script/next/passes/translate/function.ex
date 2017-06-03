defmodule ElixirScript.Translate.Function do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Clause
  alias ElixirScript.Translate.Forms.Pattern
  alias ElixirScript.Translate.Form

  @moduledoc """
  Translates the given Elixir function AST into the
  equivalent JavaScript AST. Function names are
  <name><arity>
  """

  def patterns_ast() do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier("Core")
      ),
      J.identifier("Patterns")
    )
  end

  def compile({{name, arity}, type, _, clauses}, state) do
    state = Map.put(state, :function, {name, arity})
    clauses = compile_clauses(clauses, state)

    arg_matches_declarator = J.variable_declarator(
      J.identifier("__arg_matches__"),
      J.identifier("null")
    )

    arg_matches_declaration = J.variable_declaration([arg_matches_declarator], :let)

    declarator = J.variable_declarator(
      ElixirScript.Translator.Identifier.make_function_name(name),
      J.function_expression(
                [J.rest_element(J.identifier("__function_args__"))],
                [],
                J.block_statement([
                  arg_matches_declaration,
                  clauses,
                  J.throw_statement(
                    J.call_expression(
                      J.member_expression(
                        patterns_ast(),
                        J.identifier("MatchError")
                      ),
                      [J.identifier("__function_args__")]
                    )
                  )
                ])
              )
    )

    { J.variable_declaration([declarator], :const), state }
  end

  defp compile_clauses(clauses, state) do
    clauses
    |> Enum.map(&compile_clause(&1, state))
    |> Enum.map(fn {patterns, params, guards, body} ->
      match_or_default_call = J.call_expression(
        J.member_expression(
          patterns_ast(),
          J.identifier("match_or_default")
        ),
        [J.array_expression(patterns), J.identifier("__function_args__"), guards]
      )

      J.if_statement(
        J.binary_expression(
          :!==,
          J.assignment_expression(:=, J.identifier("__arg_matches__"), match_or_default_call),
          J.identifier("null")
        ),
        J.block_statement(body)
      )
    end)
    |> Enum.reverse
    |> Enum.reduce(nil, fn 
      if_ast, nil ->
        if_ast
      if_ast, ast ->
        %{if_ast | alternate: ast}
    end)
  end

  defp compile_clause({ _, args, guards, body}, state) do
    state = Map.put(state, :vars, %{})

    {patterns, params, state} = Pattern.compile(args, state)
    guard = Clause.compile_guard(params, guards, state)

    body = case body do
      nil ->
        J.identifier("null")
      {:__block__, _, block_body} ->
        {list, _} = Enum.map_reduce(block_body, state, &Form.compile(&1, &2))
        List.flatten(list)
      b when is_list(b) ->
        {list, _} = Enum.map_reduce(b, state, &Form.compile(&1, &2))
        List.flatten(list)
      _ ->
        Form.compile!(body, state)
    end

    body = body 
    |> Clause.return_last_statement

    declarator = J.variable_declarator(
      J.array_expression(params),
      J.identifier("__arg_matches__")
    )

    declaration = J.variable_declaration([declarator], :const)

    body = [declaration] ++ body
    {patterns, params, guard, body}
  end

  defp compile_clause({:->, _, [[{:when, _, params}], body ]}, state) do
    guards = List.last(params)
    params = params |> Enum.reverse |> tl |> Enum.reverse

    compile_clause({[], params, guards, body}, state)
  end

  defp compile_clause({:->, _, [params, body]}, state) do
    compile_clause({[], params, [], body}, state)
  end
end
