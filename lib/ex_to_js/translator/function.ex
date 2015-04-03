defmodule ExToJS.Translator.Function do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator

  def make_function_call(function_name, params) do
    Builder.call_expression(
      Builder.identifier(function_name),
      Enum.map(params, &Translator.translate(&1))
    )
  end

  def make_function_call(module_name, function_name, params) do
    the_name = case module_name do
      {:__aliases__, _, name} ->
        name
      {name, _, _} ->
        name
      name ->
        name
    end

    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier(the_name),
        Builder.identifier(function_name)
      ),
      Enum.map(params, &Translator.translate(&1))
    )
  end

  def make_function(name, params, body) do
    do_make_function(name, params, body)
  end

  def make_export_function(name, params, body) do
    do_make_function(name, params, body)
    |> Builder.export_declaration
  end

  defp do_make_function(name, params, body) do
    body = cond do
      body == nil ->
        []
      is_list(body) ->
        Enum.map(body, &Translator.translate(&1))
      true ->
        [Translator.translate(body)]
    end

    body = return_last_expression(body)

    Builder.function_declaration(
      Builder.identifier(name),
      Enum.map(params, &Translator.translate(&1)),
      [],
      Builder.block_statement(body)
    )
  end

  def make_anonymous_function(params, body) do
    Builder.arrow_function_expression(
      Enum.map(params, &Translator.translate(&1)),
      [],
      Builder.block_statement([Translator.translate(body)])
    )
  end

  defp return_last_expression([]) do
    [Builder.return_statement(Builder.literal(nil))]
  end

  defp return_last_expression(%ESTree.BlockStatement{} = block) do
    %ESTree.BlockStatement{ block | body: return_last_expression(block.body) }
  end

  defp return_last_expression(list) when is_list(list) do
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
      %ESTree.IfStatement{} ->

        consequent = return_last_expression(last_item.consequent)

        alternate = if last_item.alternate do
          return_last_expression(last_item.alternate)
        else
          nil
        end

        last_item = %ESTree.IfStatement{ last_item | consequent: consequent, alternate: alternate }
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

    if is_list(last_item) do
      list ++ last_item
    else
      list ++ [last_item]
    end
  end

end