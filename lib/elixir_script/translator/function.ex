defmodule ElixirScript.Translator.Function do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.PatternMatching

  def make_function_or_property_call(module_name, function_name) do        
        params = [
          module_name,
          to_string(function_name)
        ]

    Utils.make_call_expression("ElixirScript", "get_property_or_call_function", params)
  end

  def make_function_call(function_name, params) do
    Utils.make_call_expression(function_name, params)
  end

  def make_function_call(module_name, function_name, params) do
    the_name = case module_name do
      {:__aliases__, _, name} ->
        name
      {name, _, _} ->
        name
      name ->
        case to_string(name) do
          "Elixir." <> actual_name ->
            actual_name
          _ ->
            name
        end
    end

    Utils.make_call_expression(the_name, function_name, params)
  end

  def make_function(name, params, body, guards \\ nil) do
    do_make_function(name, params, body, guards)
  end

  def make_export_function(name, params, body, guards \\ nil) do
    do_make_function(name, params, body, guards)
    |> Builder.export_declaration
  end

  def pattern_match_identifier(index) do
    Utils.make_array_accessor_call("arguments", index)
  end

  defp do_make_function(name, params, body, guards) do
    { body, params } = prepare_function_body(body) |> PatternMatching.build_pattern_matched_body(params, &pattern_match_identifier/1)

    body = if guards do
      [Builder.if_statement(
        guards |> Enum.map(&Translator.translate(&1)) |> hd,
        Builder.block_statement(body)
      )
    ]
    else
      body
    end

    Builder.function_declaration(
      Builder.identifier(name),
      params,
      [],
      Builder.block_statement(body)
    )
  end

  def make_anonymous_function(params, body) do
    Builder.function_expression(
      Enum.map(params, &Translator.translate(&1)),
      [],
      Builder.block_statement(prepare_function_body(body))
    )
  end

  defp prepare_function_body(body) do
    case body do
      nil ->
        []
      list when is_list(list) ->
        Enum.map(list, &Translator.translate(&1))
      _ ->
        [Translator.translate(body)]
    end
    |> Utils.inflate_groups
    |> return_last_expression
  end

  def return_last_expression([]) do
    [Builder.return_statement(Builder.literal(nil))]
  end

  def return_last_expression(%ESTree.BlockStatement{} = block) do
    %ESTree.BlockStatement{ block | body: return_last_expression(block.body) }
  end

  def return_last_expression(list) when is_list(list) do
    last_item = List.last(list)

    last_item = case last_item do
      %ESTree.Literal{} ->
        Builder.return_statement(last_item) 
      %ESTree.Identifier{} ->
        Builder.return_statement(last_item) 
      %ESTree.VariableDeclaration{} ->
        declaration = hd(last_item.declarations).id

        return_statement = case declaration do
          %ESTree.ArrayPattern{} ->
            Builder.return_statement(Builder.array_expression(declaration.elements))
          _ ->
            Builder.return_statement(declaration)  
        end

        [last_item, return_statement]
      %ESTree.BlockStatement{} ->
        last_item = %ESTree.BlockStatement{ last_item | body: return_last_expression(last_item.body) }
      _ ->
        if String.contains?(last_item.type, "Expression") do
          Builder.return_statement(last_item) 
        else
          [last_item, Builder.return_statement(Builder.literal(nil))]
        end    
    end


    list = Enum.take(list, length(list)-1) 
    |> Enum.map(fn(x) ->
      case x do
        %ESTree.MemberExpression{} ->
          Builder.expression_statement(x)
        %ESTree.CallExpression{} ->
          Builder.expression_statement(x)
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