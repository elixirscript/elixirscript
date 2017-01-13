defmodule ElixirScript.Translator.Function do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Group
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Block

  @patterns JS.member_expression(
    JS.member_expression(
      JS.identifier("Elixir"),
      JS.identifier("Core")
    ),
    JS.identifier("Patterns")
  )

  def make_anonymous_function(functions, env, name \\ nil) do
    clauses = functions
    |> Enum.map(fn
      {:->, _, [ [{:when, _, [params | guards]}], body ]} ->
        process_function_body(params, body, env, name, guards)

      ({:->, _, [params, body]}) ->
        process_function_body(params, body, env, name)

      ({_, _, [{:when, _, [{_, _, params} | guards] }, body]}) ->
        body = convert_to_try(body)
        process_function_body(params, body, env, name, guards)

      ({_, _, [{_, _, params}, body]}) ->
        body = convert_to_try(body)
        process_function_body(params, body, env, name)

      ({_, _, [{_, _, params}]}) ->
        process_function_body(params, [], env, name)
    end)

    { make_defmatch(clauses, env.context == :generator), env }
  end

  def convert_to_try([do: body]) do
    body
  end

  def convert_to_try(function_kw_list) do
    { :__block__, [], [{ :try, [], [function_kw_list] }] }
  end

  def make_defmatch(clauses, true) do
    JS.call_expression(
      JS.member_expression(
        @patterns,
        JS.identifier("defmatchgen")
      ),
      clauses
    )
  end

  def make_defmatch(clauses, _) do
    JS.call_expression(
      JS.member_expression(
        @patterns,
        JS.identifier("defmatch")
      ),
      clauses
    )
  end

  defp process_function_body(params, body, env, name, guards \\ nil) do
    env = ElixirScript.Translator.LexicalScope.function_scope(env, {name, get_arity(params)})

    { patterns, params, env } = process_params(params, env)
    { body, _ } = make_function_body(body, env)

    if guards do
      { guard_body, _ } = hd(List.wrap(guards))
      |> prepare_function_body(%{ env | context: :guard})

      guard_body = JS.block_statement(guard_body)
      make_function_clause(patterns, params, body, guard_body, env.context == :generator)
    else
      make_function_clause(patterns, params, body, nil, env.context == :generator)
    end
  end

  def wrap_params(params) when is_atom(params), do: []
  def wrap_params(params), do: List.wrap(params)

  def make_function_body(body, env) do
    { body, _ } = body
    |> prepare_function_body(env)


    { JS.block_statement(body), env }
  end

  defp get_arity(params) when is_atom(params), do: 0
  defp get_arity(params) when is_tuple(params), do: 1
  defp get_arity(params), do: length(params)

  defp make_params(params) do
    Enum.filter(params, fn
      (%ESTree.Identifier{name: :undefined}) -> false
      (_) -> true
    end)
  end

  defp process_params(params, env) do
    params = wrap_params(params)
    { patterns, params, env } = PatternMatching.process_match(params, env)
    { patterns, make_params(params), env }
  end

  def make_function_clause(patterns, params, body, guard_body, is_generator?) do

    arguments = case guard_body do
                  nil ->
                    [
                      JS.array_expression(patterns),
                      JS.function_expression(params, [], body, is_generator?)
                    ]
                  _ ->
                    [
                      JS.array_expression(patterns),
                      JS.function_expression(params, [], body, is_generator?),
                      JS.function_expression(params, [], guard_body)
                    ]
                end


    JS.call_expression(
      JS.member_expression(
        @patterns,
        JS.identifier("clause")
      ),
      arguments
    )
  end

  def prepare_function_body(body, env) do
    { list, env } = case body do
      nil ->
        { [], env }
      list when is_list(list) ->
        t = Translator.translate!(list, env)
        {[t], env}
      {:__block__, _, list} ->
        Enum.map_reduce(list, env, fn(x, env) ->
          Translator.translate(x, env)
        end)
                      _ ->

                        Enum.map_reduce(List.wrap(body), env, fn(x, env) ->
          Translator.translate(x, env)
        end)
    end

    list = Group.inflate_groups(list)
    |> return_last_expression

    { list, env }
  end

  def return_last_expression(nil) do
    nil
  end

  def return_last_expression([]) do
    [JS.return_statement(JS.literal(nil))]
  end

  def return_last_expression(%ESTree.BlockStatement{} = block) do
    %ESTree.BlockStatement{ block | body: return_last_expression(block.body) }
  end

  def return_last_expression(list) when is_list(list) do
    last_item = List.last(list)

    last_item = case last_item do
      %ESTree.YieldExpression{} ->
        JS.return_statement(last_item)
      %ESTree.Literal{} ->
        JS.return_statement(last_item)
      %ESTree.Identifier{} ->
        JS.return_statement(last_item)
      %ESTree.VariableDeclaration{} ->
        declaration = hd(last_item.declarations).id

        return_statement = case declaration do
          %ESTree.ArrayPattern{elements: elements} ->
            if(length(elements) == 1) do
              JS.return_statement(hd(declaration.elements))
            else
              JS.return_statement(JS.array_expression(declaration.elements))
            end
          _ ->
            JS.return_statement(declaration)
        end

        [last_item, return_statement]
      %ESTree.BlockStatement{} ->
        last_item = %ESTree.BlockStatement{ last_item | body: return_last_expression(last_item.body) }
      _ ->
                    if String.contains?(last_item.type, "Expression") do
                        JS.return_statement(last_item)
                    else
                      [last_item, JS.return_statement(JS.literal(nil))]
                    end
    end


    list = Enum.take(list, length(list)-1)
    |> Enum.map(fn(x) ->
      case x do
        %ESTree.MemberExpression{} ->
          JS.expression_statement(x)
        %ESTree.CallExpression{} ->
          JS.expression_statement(x)
        _ ->
          x
      end
    end)

    if is_list(last_item) do
      list ++ last_item
    else
      list ++ [last_item]
    end
  end
end
