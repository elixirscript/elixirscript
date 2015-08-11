defmodule ElixirScript.Translator.Function do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.PatternMatching.Match
  alias ElixirScript.Preprocess.Variables


  def process_function(name, functions) do
    result = make_anonymous_function(functions)

    declarator = JS.variable_declarator(
      JS.identifier(name),
      result
    )

    JS.variable_declaration([declarator], :let)
  end

  def make_anonymous_function(functions) do
    clauses = functions
    |> Stream.map(fn(x) -> Variables.process(x) end)
    |> Stream.map(fn
      {:->, _, [ [{:when, _, [params | guards]}], body ]} ->
        { patterns, params } = Match.build_match(List.wrap(params))

        body = body
        |> prepare_function_body
        |> JS.block_statement

        guard_body = hd(List.wrap(guards))
        |> prepare_function_body
        |> JS.block_statement

        JS.array_expression([
          JS.array_expression(patterns),
          JS.function_expression(
            params,
            [],
            body
          ),
          JS.function_expression(
            params,
            [],
            guard_body
          )
        ])

      ({:->, _, [params, body]}) ->
        { patterns, params } = Match.build_match(params)

        body = body
        |> prepare_function_body
        |> JS.block_statement

        JS.array_expression([
          JS.array_expression(patterns),
          JS.function_expression(
            params,
            [],
            body
          )
        ])        

      ({_, _, [{:when, _, [{_, _, params} | guards] }, [do: body]]}) ->
        { patterns, params } = Match.build_match(params)

        body = body
        |> prepare_function_body
        |> JS.block_statement

        guard_body = hd(guards)
        |> prepare_function_body
        |> JS.block_statement

        JS.array_expression([
          JS.array_expression(patterns),
          JS.function_expression(
            params,
            [],
            body
          ),
          JS.function_expression(
            params,
            [],
            guard_body
          )
        ])

      ({_, _, [{_, _, params}, [do: body]]}) ->
        { patterns, params } = Match.build_match(params)

        body = body
        |> prepare_function_body
        |> JS.block_statement

        JS.array_expression([
          JS.array_expression(patterns),
          JS.function_expression(
            params,
            [],
            body
          )
        ])
    end)
    |> Enum.to_list

    JS.call_expression(
      JS.identifier("fun"),
      clauses
    )
  end

  def make_function_or_property_call(module_name, function_name) do
    the_name = case module_name do
      {:__aliases__, _, name} ->
        name
      {name, _, _} when is_atom(name) ->
        name
      {{:., _, [_module_name, _function_name]}, _, _params } = ast ->
        ast
      name ->
        case to_string(name) do
          "Elixir." <> actual_name ->
            actual_name
          _ ->
            name
        end
    end

    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Kernel"),
          JS.identifier("JS")
        ),
        JS.identifier("get_property_or_call_function")
      ),
      [
        Utils.make_module_expression_tree(the_name, false),
        Translator.translate(to_string(function_name))
      ]
    )
  end

  def make_function_call(function_name, params) do
    Utils.make_call_expression(Utils.filter_name(function_name), params)
  end

  def make_function_call(module_name, function_name, params) do
    the_name = case module_name do
      {:__aliases__, _, name} ->
        name
      {name, _, _} when is_atom(name) ->
        name
      {{:., _, [_module_name, _function_name]}, _, _params } = ast ->
        ast
      name ->
        case to_string(name) do
          "Elixir." <> actual_name ->
            actual_name
          _ ->
            name
        end
    end

    Utils.make_call_expression(the_name, Utils.filter_name(function_name), params)
  end

  def prepare_function_body(body) do
    case body do
      nil ->
        []
      list when is_list(list) ->
        Enum.map(list, &Translator.translate(&1))
      {:__block__, _, list} ->
        Enum.map(list, &Translator.translate(&1))
      _ ->
        [Translator.translate(body)]
    end
    |> Utils.inflate_groups
    |> return_last_expression
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
      %ESTree.Literal{} ->
        JS.return_statement(last_item) 
      %ESTree.Identifier{} ->
        JS.return_statement(last_item) 
      %ESTree.VariableDeclaration{} ->
        declaration = hd(last_item.declarations).id

        return_statement = case declaration do
          %ESTree.ArrayPattern{} ->
            JS.return_statement(JS.array_expression(declaration.elements))
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

  def make_capture

end