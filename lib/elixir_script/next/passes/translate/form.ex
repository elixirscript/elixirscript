defmodule ElixirScript.Translate.Form do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Forms.{Bitstring, Match, Try, For, Receive, Remote, Pattern}
  alias ElixirScript.Translate.Functions.{Erlang, Lists, Maps}
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Translate.Clause
  require Logger

  @moduledoc """
  Handles translation of all forms that are not functions or clauses
  """

  def compile!(ast, state) do
    {js_ast, _} = compile(ast, state)

    js_ast
  end

  def compile(nil, state) do
    { J.identifier("null"), state }
  end

  def compile(form, state) when is_boolean(form) or is_integer(form) or is_float(form) or is_binary(form)  do
    { J.literal(form), state }
  end

  def compile(form, state) when is_list(form) do
    ast = J.array_expression(
      Enum.map(form, &compile!(&1, state))
    )

    { ast, state }
  end

  def compile(form, state) when is_atom(form) do
    ast = if ElixirScript.Translate.Module.is_elixir_module(form) do
      Remote.process_module_name(form, state)
    else
      J.call_expression(
        J.member_expression(
          J.identifier("Symbol"),
          J.identifier("for")
        ),
        [J.literal(form)]
      )
    end

    { ast, state }
  end

  def compile({a, b}, state) do
    compile({:{}, [], [a, b]}, state)
  end

  def compile({:{}, _, elements}, state) do
    ast = J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      Enum.map(elements, &compile!(&1, state)) |> List.flatten
    )

    {ast, state}
  end

  def compile({:%{}, _, _} = map, state) do
    ElixirScript.Translate.Forms.Map.compile(map, state)
  end

  def compile({:<<>>, _, _} = bitstring, state) do
    Bitstring.compile(bitstring, state)
  end

  def compile({:=, _, [_, _]} = match, state) do
    Match.compile(match, state)
  end

  def compile({:%, _, [module, params]}, state) do
    ast = J.call_expression(
      J.member_expression(
        Remote.process_module_name(module),
        J.identifier("__struct__")
      ),
      [Form.compile!(params, state)]
    )

    { ast, state }
  end

  def compile({:for, _, _} = ast, state) do
    For.compile(ast, state)
  end

  def compile({:case, _, [condition, [do: clauses]]}, state) do
    func = J.call_expression(
      J.member_expression(
        ElixirScript.Translate.Function.patterns_ast(),
        J.identifier("defmatch")
      ),
      Enum.map(clauses, fn x -> Clause.compile(x, state) |> elem(0) end) |> List.flatten
    )

    ast = J.call_expression(
      J.member_expression( func, J.identifier("call")),
      [J.identifier(:this), compile!(condition, state)]
    )

    { ast, state }
  end

  def compile({:cond, _, [[do: clauses]]}, state) do
    processed_clauses = Enum.map(clauses, fn({:->, _, [clause, clause_body]}) ->
      { translated_body, state } = Enum.map_reduce(List.wrap(clause_body), state, &compile(&1, &2))
      
      translated_body = translated_body
      |> List.flatten
      |> Clause.return_last_statement
      
      translated_body = J.arrow_function_expression([], [], J.block_statement(translated_body))

      { translated_clause, _ }  = compile(hd(clause), state)


      J.array_expression([translated_clause, translated_body])
    end)


    cond_function = J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.member_expression(
          J.identifier("Core"),
          J.identifier("SpecialForms")
        )
      ),
      J.identifier("cond")
    )

    ast = J.call_expression(
      cond_function,
      processed_clauses
    )

    { ast, state }
  end

  def compile({:receive, context, [blocks]}, state) do
    line = Keyword.get(context, :line, 1)
    {function, arity} = Map.get(state, :function)
    Logger.warn "receive not supported, Module: #{inspect state.module}, Function: #{function}/#{arity}, Line: #{line}"
    Receive.compile(blocks, state)
  end

  def compile({:try, _, [blocks]}, state) do
    Try.compile(blocks, state)
  end

  def compile({:fn, _, clauses}, state) do
    {clauses_ast, _} = Enum.map_reduce(clauses, state, &Clause.compile(&1, &2))

    ast = J.call_expression(
      J.member_expression(
        ElixirScript.Translate.Function.patterns_ast(),
        J.identifier("defmatch")
      ),
      clauses_ast
    )

    {ast, state}
  end

  def compile({:., _, call} = ast, state) when is_list(call) do
    Remote.compile(ast, state)
  end

  def compile({:super, context, params}, state) when is_list(params) do
    {function_name, _} = Map.get(state, :function)

    ast = J.call_expression(
      ElixirScript.Translator.Identifier.make_function_name(function_name),
      Enum.map(params, &compile!(&1, state)) |> List.flatten
    )

    {ast, state}
  end

  def compile({var, _, params}, state) when is_list(params) and is_atom(var) do
    ast = J.call_expression(
      ElixirScript.Translator.Identifier.make_function_name(var),
      Enum.map(params, &compile!(&1, state)) |> List.flatten
    )

    {ast, state}
  end

  def compile({function, _, params}, state) when is_list(params) do
    ast = J.call_expression(
      compile!(function, state),
      Enum.map(params, &compile!(&1, state)) |> List.flatten
    )

    {ast, state}
  end

  def compile({var, _, _}, state) do
    var = Pattern.get_variable_name(to_string(var), state)
    { ElixirScript.Translator.Identifier.make_identifier(var), state }
  end

end
