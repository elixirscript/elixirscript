defmodule ElixirScript.Translator.For do
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils


  def make_for(generators) do
    _results = Translator.translate(quote do: _results)
    variable_declaration = Translator.translate(quote do: _results = [])

    block_statement = [variable_declaration] ++ [handle_generators(generators)] ++ [Builder.return_statement(_results)]

    Utils.wrap_in_function_closure(block_statement)
  end

  defp handle_generators(generators) do

    case hd(generators) do
      {:<-, [], [identifier, enum]} ->
        case identifier do
          {value_one, value_two} ->
            elements = [value_one, value_two]
            make_tuple_for(elements, enum, generators)
          {:{}, _, elements} ->
            make_tuple_for(elements, enum, generators)         
          _ ->
            i = Translator.translate(identifier)
            variable_declarator = Builder.variable_declarator(i)
            variable_declaration = Builder.variable_declaration([variable_declarator], :let)
            
            Builder.for_of_statement(
              variable_declaration,
              Translator.translate(enum),
              Builder.block_statement(List.wrap(handle_generators(tl(generators))))
            )
        end
      [into: _expression] ->
        raise ElixirScript.UnsupportedError, :into
      [do: expression] ->
        push_last_expression(Translator.translate(expression))
      filter ->
        Builder.if_statement(
          Translator.translate(filter), 
          handle_generators(tl(generators)), 
          nil
        )
    end

  end

  defp make_tuple_for(elements, enum, generators) do
    i = Builder.identifier("_ref")
    variable_declarator = Builder.variable_declarator(i)
    variable_declaration = Builder.variable_declaration([variable_declarator], :let)

    { variables, _ } = Enum.map_reduce(elements, 0, 
      fn(x, index) -> 
        case Translator.translate(x) do
          %ESTree.Identifier{} ->
            variable_declarator = Builder.variable_declarator(Translator.translate(x),
              Builder.call_expression(
                Builder.member_expression(
                  Builder.identifier(:Kernel),
                  Builder.identifier(:elem)
                ),
                [i, Builder.literal(index)]
              )
            )
            variable_declaration = Builder.variable_declaration([variable_declarator], :let)

            {variable_declaration, index + 1}
          _ ->
            {nil, index + 1}
        end
      end)

    variables = Enum.filter(variables, fn(x) -> x != nil end)

    new_identifier = Enum.map(elements, fn(x) ->
        case Translator.translate(x) do
          %ESTree.Identifier{} ->
            Builder.identifier(:undefined)
          _ ->
            Translator.translate(x)
        end
    end) 
    
    new_identifier = Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("tuple")
      ),
      new_identifier
    )

    Builder.for_of_statement(
      variable_declaration,
      Translator.translate(enum),
      Builder.block_statement(
        [
          Builder.if_statement(
            Utils.make_match(i, new_identifier),
            Builder.block_statement(variables ++ List.wrap(handle_generators(tl(generators))))
          )
        ]
      )
    )
  end

  defp push_last_expression(%ESTree.BlockStatement{} = block) do
    %ESTree.BlockStatement{ block | body: push_last_expression(block.body) }
  end

  defp push_last_expression([]) do
    build_push_ast(Builder.literal(nil))
  end

  defp push_last_expression(list) when is_list(list) do
    last_item = List.last(list)

    last_item = case last_item do
      %ESTree.Literal{} ->
        build_push_ast(last_item)
      %ESTree.Identifier{} ->
        build_push_ast(last_item)
      %ESTree.VariableDeclaration{} ->
        declaration = hd(last_item.declarations).id

        push_statement = case declaration do
          %ESTree.ArrayPattern{} ->
            build_push_ast(Builder.array_expression(declaration.elements))
          _ ->
            build_push_ast(declaration) 
        end

        [last_item, push_statement]
      %ESTree.IfStatement{} ->

        consequent = push_last_expression(last_item.consequent)

        alternate = if last_item.alternate do
          push_last_expression(last_item.alternate)
        else
          nil
        end

        last_item = %ESTree.IfStatement{ last_item | consequent: consequent, alternate: alternate }
      %ElixirScript.Translator.Group{body: body} ->
        last_item = push_last_expression(body)
      %ESTree.BlockStatement{} ->
        last_item = %ESTree.BlockStatement{ last_item | body: push_last_expression(last_item.body) }
      _ ->
        if String.contains?(last_item.type, "Expression") do
          build_push_ast(last_item)
        else
          [last_item, build_push_ast(Builder.literal(nil))]
        end    
    end


    list = Enum.take(list, length(list)-1)

    if is_list(last_item) do
      list ++ last_item
    else
      list ++ [last_item]
    end
  end

  defp push_last_expression(expression) do
    build_push_ast(expression)
  end

  defp build_push_ast(param) do

    Builder.expression_statement(
      Builder.assignment_expression(
        :=,
        Builder.identifier(:_results),
          Builder.call_expression(
            Builder.member_expression(
              Builder.identifier("List"),
              Builder.identifier("append")
            ),
            [Builder.identifier(:_results), param]
          )
      )
    )

  end

  
end