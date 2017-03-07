defmodule ElixirScript.Experimental.Form do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Forms.{Map, Bitstring, Match, Call, Try, For, Struct}
  alias ElixirScript.Experimental.Functions.{Erlang, Lists, Maps}
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Experimental.Clause

  @moduledoc """
  Handles translation of all forms that are not functions or clauses
  """

  def compile(nil) do
    J.identifier("null")
  end

  def compile(form) when is_boolean(form) when is_integer(form) when is_float(form) when is_binary(form)  do
    J.literal(form)
  end

  def compile(form) when is_list(form) do
    J.array_expression(
      Enum.map(form, &compile(&1))
    )
  end

  def compile(form) when is_atom(form) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [J.literal(form)]
    )
  end

  def compile({a, b}) do
    compile({:{}, [], [a, b]})
  end

  def compile({:{}, _, elements}) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      ),
      Enum.map(elements, &compile(&1))
    )
  end

  def compile({:%{}, _, _} = map) do
    Map.compile(map)
  end

  def compile({:<<>>, _, _} = bitstring) do
    Bitstring.compile(bitstring)
  end

  def compile({:=, _, [left, right]} = match) do
    Match.compile(match)
  end

  def compile({:%, _, [_, _]} = ast) do
    Struct.compile(ast)
  end

  def compile({:for, _, _} = ast) do
    For.compile(ast)
  end

  def compile({:case, _, [condition, [do: clauses]]}) do
    func = J.call_expression(
      J.member_expression(
        ElixirScript.Experimental.Function.patterns_ast(),
        J.identifier("defmatch")
      ),
      Enum.map(clauses, &Clause.compile(&1))
    )

    J.call_expression(
      J.member_expression( func, J.identifier("call")),
      [J.identifier(:this), compile(condition)]
    )
  end

  def compile({:cond, _, [[do: clauses]]}) do
    processed_clauses = Enum.map(clauses, fn({:->, _, [clause, clause_body]}) ->
      translated_body = Enum.map(List.wrap(clause_body), &compile(&1))
      |> Clause.return_last_statement
      translated_body = J.function_expression([], [], J.block_statement(translated_body))

      translated_clause = compile(hd(clause))


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

    J.call_expression(
      cond_function,
      processed_clauses
    )
  end

  def compile({:receive, _, _}) do
    raise "receive not implemented"
  end

  def compile({:try, _, [blocks]}) do
    Try.compile(blocks)
  end

  def compile({:fn, _, clauses}) do
    J.call_expression(
      J.member_expression(
        ElixirScript.Experimental.Function.patterns_ast(),
        J.identifier("defmatch")
      ),
      Enum.map(clauses, &Clause.compile(&1))
    )
  end

  def compile({{:., _, [:erlang, _]}, _, _} = ast) do
    Erlang.rewrite(ast)
  end

  def compile({{:., _, [:lists, _]}, _, _} = ast) do
    Lists.rewrite(ast)
  end

  def compile({{:., _, [:maps, _]}, _, _} = ast) do
    Maps.rewrite(ast)
  end

  def compile({{:., _, [_, _]}, _, _} = ast) do
    Call.compile(ast)
  end

  def compile({:super, context, params}) do
    {function_name, _} = Keyword.fetch!(context, :function)

    J.call_expression(
      J.identifier("#{function_name}#{length(params)}"),
      Enum.map(params, &compile(&1))
    )
  end

  def compile({function_name, _, params}) when is_list(params) do
    J.call_expression(
      J.identifier("#{function_name}#{length(params)}"),
      Enum.map(params, &compile(&1))
    )
  end

  def compile({var, _, _}) do
    J.identifier(var)
  end

end
