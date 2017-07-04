defmodule ElixirScript.Translate.Form do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Forms.{Bitstring, Match, Try, For, Receive, Remote, Pattern}
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

  def compile({:|, _, [head, tail]}, state) do
    ast = J.call_expression(
      J.member_expression(
        J.array_expression([compile!(head, state)]),
        J.identifier("concat")
      ),
      [compile!(tail, state)]
    )

    { ast, state }
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
    ast = J.new_expression(
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

  def compile({:&, _, [{:/, _, [{{:., _, [_module, _function]} = ast, [], []}, _]}]}, state) do
    Remote.compile(ast, state)
  end

  def compile({:&, _, [{:/, _, [{var, _, _}, _]}]}, state) do
    ast = ElixirScript.Translate.Identifier.make_function_name(var)
    {ast, state}
  end

  def compile({:%{}, _, _} = map, state) do
    ElixirScript.Translate.Forms.Map.compile(map, state)
  end

  def compile({:<<>>, _, elements} = bitstring, state) do
    is_interpolated_string = Enum.all?(elements, fn(x) ->
      case x do
        b when is_binary(b) ->
          true
        {:::, _, [_target, {:binary, _, _}]} ->
          true
        _ ->
          false
      end
    end)

    if is_interpolated_string do
      Bitstring.make_interpolated_string(elements, state)
    else
      Bitstring.compile(bitstring, state)
    end
  end

  def compile({:=, _, [_, _]} = match, state) do
    Match.compile(match, state)
  end

  def compile({:%, _, [module, params]}, state) do
    ast = J.call_expression(
      J.member_expression(
        Remote.process_module_name(module, state),
        J.identifier("__struct__")
      ),
      [compile!(params, state)]
    )

    { ast, state }
  end

  def compile({:for, _, _} = ast, state) do
    For.compile(ast, state)
  end

  def compile({:case, _, [{:=, _, [left, _]} = match, [do: clauses]]}, state) do
    {match_ast, state} = compile(match, state)
    {case_ast, state} = compile({:case, [], [left, [do: clauses]]}, state)

    match_ast = List.wrap(match_ast)

    { match_ast ++ [case_ast], state }
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
      { translated_body, state } = ElixirScript.Translate.Function.compile_block(clause_body, state)

      translated_body = translated_body
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
    {function, _arity} = Map.get(state, :function)
    Logger.warn fn() ->
      "receive not supported, Module: #{inspect state.module}, Function: #{function}, Line: #{line}"
    end
    Receive.compile(blocks, state)
  end

  def compile({:try, _, [blocks]}, state) do
    Try.compile(blocks, state)
  end

  def compile({:fn, _, _} = ast, state) do
    ElixirScript.Translate.Function.compile(ast, state)
  end

  def compile({{:., _, [JS, _]}, _, _} = ast, state) do
    ElixirScript.Translate.Forms.JS.compile(ast, state)
  end

  def compile({:., _, call} = ast, state) when is_list(call) do
    Remote.compile(ast, state)
  end

  def compile({:super, _, params}, state) when is_list(params) do
    {function_name, _} = Map.get(state, :function)
    {var_decs, params} = compile_params(params, state)

    ast = J.call_expression(
      ElixirScript.Translate.Identifier.make_function_name(function_name),
      params
    )

    case var_decs do
      [] ->
        {ast, state}
      _ ->
        {var_decs ++ List.wrap(ast), state}
    end
  end

  def compile({var, _, params}, state) when is_list(params) and is_atom(var) do
    {var_decs, params} = compile_params(params, state)

    ast = J.call_expression(
      ElixirScript.Translate.Identifier.make_function_name(var),
      params
    )

    case var_decs do
      [] ->
        {ast, state}
      _ ->
        {var_decs ++ List.wrap(ast), state}
    end
  end

  def compile({function, _, []}, state) do
    ast = J.call_expression(
      ElixirScript.Translate.Forms.JS.call_property(),
      [compile!(function, state)]
    )

    {ast, state}
  end

  def compile({function, _, params}, state) when is_list(params) do
    {var_decs, params} = compile_params(params, state)

    ast = J.call_expression(
      compile!(function, state),
      params
    )

    case var_decs do
      [] ->
        {ast, state}
      _ ->
        {var_decs ++ List.wrap(ast), state}
    end
  end

  def compile({var, _, _}, state) do
    var = Pattern.get_variable_name(to_string(var), state)
    { ElixirScript.Translate.Identifier.make_identifier(var), state }
  end

  defp compile_params(params, state) do
    {params, var_decs} = Enum.map_reduce(params, [], fn
      ({:=, _, [left, _]} = ast, acc) ->
        {ast, state} = compile(ast, state)
        left = compile!(left, state)

        {left, acc ++ List.wrap(ast)}
      (x, acc) ->
        {compile!(x, state), acc}
    end)

    {var_decs, params}
  end

end
