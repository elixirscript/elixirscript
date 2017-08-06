defmodule ElixirScript.Translate.Function do
  @moduledoc false

  # Translates the given Elixir function AST into the
  # equivalent JavaScript AST.

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.{Clause, Form}
  alias ElixirScript.Translate.Forms.Pattern

  def patterns_ast() do
    J.member_expression(
      J.member_expression(
        J.identifier("ElixirScript"),
        J.identifier("Core")
      ),
      J.identifier("Patterns")
    )
  end

  def compile({:fn, _, clauses}, state) do
    clauses = compile_clauses(clauses, state)

    arg_matches_declarator = J.variable_declarator(
      J.identifier("__arg_matches__"),
      J.identifier("null")
    )

    arg_matches_declaration = J.variable_declaration(
      [arg_matches_declarator],
      :let
    )

    function_recur_dec = J.function_declaration(
      J.identifier("recur"),
      [J.rest_element(J.identifier("__function_args__"))],
      [],
      J.block_statement([
        arg_matches_declaration,
        clauses,
        J.throw_statement(
          J.new_expression(
            J.member_expression(
              patterns_ast(),
              J.identifier("MatchError")
            ),
            [J.identifier("__function_args__")]
          )
        )
      ])
    )

    function_dec = J.arrow_function_expression(
      [J.rest_element(J.identifier("__function_args__"))],
      [],
      J.block_statement([
        function_recur_dec,
        J.return_statement(
          trampoline()
        )
      ])
    )

    { function_dec, state }
  end

  def compile({{name, arity}, _type, _, clauses}, state) do
    state = Map.put(state, :function, {name, arity})
    clauses = compile_clauses(clauses, state)

    arg_matches_declarator = J.variable_declarator(
      J.identifier("__arg_matches__"),
      J.identifier("null")
    )

    arg_matches_declaration = J.variable_declaration(
      [arg_matches_declarator],
      :let
    )

    function_recur_dec = J.function_declaration(
      J.identifier("recur"),
      [J.rest_element(J.identifier("__function_args__"))],
      [],
      J.block_statement([
        arg_matches_declaration,
        clauses,
        J.throw_statement(
          J.new_expression(
            J.member_expression(
              patterns_ast(),
              J.identifier("MatchError")
            ),
            [J.identifier("__function_args__")]
          )
        )
      ])
    )

    function_dec = J.function_declaration(
      ElixirScript.Translate.Identifier.make_function_name(name),
      [J.rest_element(J.identifier("__function_args__"))],
      [],
      J.block_statement([
        function_recur_dec,
        J.return_statement(
          trampoline()
        )
      ])
    )

    { function_dec, state }
  end

  defp compile_clauses(clauses, state) do
    clauses
    |> Enum.map(&compile_clause(&1, state))
    |> Enum.map(fn {patterns, _params, guards, body} ->
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
    state = if Map.has_key?(state, :vars) do
      state
    else
      Map.put(state, :vars, %{})
    end

    {patterns, params, state} = Pattern.compile(args, state)
    guard = Clause.compile_guard(params, guards, state)

    {body, _state} = compile_block(body, state)

    body = body
    |> Clause.return_last_statement
    |> update_last_call(state)

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

  def compile_block(block, state) do
    ast = case block do
      nil ->
        J.identifier("null")
      {:__block__, _, block_body} ->
        {list, _} = Enum.map_reduce(block_body, state, &Form.compile(&1, &2))
        List.flatten(list)
      _ ->
        Form.compile!(block, state)
    end

    {ast, state}
  end

  defp update_last_call(clause_body, %{function: {name, _}}) do
    last_item = List.last(clause_body)
    function_name = ElixirScript.Translate.Identifier.make_function_name(name)

    case last_item do
      %ESTree.ReturnStatement{ argument: %ESTree.CallExpression{ callee: ^function_name, arguments: arguments } } ->
        new_last_item = J.return_statement(
          recurse(
            recur_bind(arguments)
          )
        )

        List.replace_at(clause_body, length(clause_body) - 1, new_last_item)
      _ ->
        clause_body
    end
  end

  defp recur_bind(args) do
    J.call_expression(
      J.member_expression(
        J.identifier("recur"),
        J.identifier("bind")
      ),
      [J.identifier("null")] ++ args
    )
  end

  defp recurse(func) do
    J.new_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("ElixirScript"),
          J.member_expression(
            J.identifier("Core"),
            J.identifier("Functions")
          )
        ),
        J.identifier("Recurse")
      ),
      [
        func
      ]
    )
  end

  defp trampoline() do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("ElixirScript"),
          J.member_expression(
            J.identifier("Core"),
            J.identifier("Functions")
          )
        ),
        J.identifier("trampoline")
      ),
      [
        recurse(
          recur_bind([J.rest_element(J.identifier("__function_args__"))])
        )
      ]
    )
  end
end
