defmodule ElixirScript.Translator.Control do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.PatternMatching

  def make_block(expressions) do
    Builder.block_statement(Enum.map(expressions, &Translator.translate(&1)))
  end

  def make_if(test, blocks) do
    test = Translator.translate(test)

    consequent = Builder.block_statement([Translator.translate(blocks[:do])])
    |> Function.return_last_expression

    alternate = case blocks[:else] do
      nil ->
        nil
      _ ->
        Builder.block_statement([Translator.translate(blocks[:else])])
        |> Function.return_last_expression        
    end

    Builder.if_statement(test, consequent, alternate)
    |> Utils.wrap_in_function_closure()

  end

  def make_cond(clauses) do
    process_cond(clauses, nil)
    |> Utils.wrap_in_function_closure()
  end

  def make_case(condition, clauses) do
    process_case(condition, clauses, nil)
    |> Utils.wrap_in_function_closure()
  end

  defp process_cond([], ast) do
    ast
  end

  defp process_cond(clauses, ast) do
    {:->, _, [clause, clause_body]} = hd(clauses)

    translated_body = Translator.translate(clause_body)

    if translated_body.type != "BlockStatement" do
      translated_body = Builder.block_statement([translated_body])
    end

    translated_body = Builder.block_statement(Utils.inflate_groups(translated_body.body))
    translated_body = Function.return_last_expression(translated_body)

    if hd(clause) == true do
      translated_body   
    else
      ast = Builder.if_statement(
        Translator.translate(hd(clause)),
        translated_body,
        nil
      )

      %ESTree.IfStatement{ ast |  alternate: process_cond(tl(clauses), nil) }
    end
  end

  defp process_case(_predicate, [], ast) do
    ast
  end

  defp process_case(condition, clauses, ast) do
    {:->, _, [clause, clause_body]} = hd(clauses)

    translated_body = Translator.translate(clause_body)

    if translated_body.type != "BlockStatement" do
      translated_body = Builder.block_statement([translated_body])
    end

    translated_body = Builder.block_statement(Utils.inflate_groups(translated_body.body))

    translated_body = Function.return_last_expression(translated_body)

    case hd(clause) do
      {:when, _, [_the_clause, guard]} ->
        result = PatternMatching.build_pattern_matched_body(translated_body.body, [hd(clause)],
        fn(_index) ->
          Translator.translate(condition)
        end, List.wrap(guard))

        { ast, _params } = result
        ast = hd(ast)

        %ESTree.IfStatement{ ast |  alternate: process_case(condition, tl(clauses), nil) }        
      _ ->
        case Translator.translate(hd(clause)) do
          %ESTree.Identifier{name: :undefined} ->
            translated_body
          _ ->
            result = PatternMatching.build_pattern_matched_body(translated_body.body, [hd(clause)],
            fn(_index) ->
              Translator.translate(condition)
            end, nil)
            { ast, _params } = result
            ast = hd(ast)

            %ESTree.IfStatement{ ast |  alternate: process_case(condition, tl(clauses), nil) }          
        end
    end 
  end


  def make_for(generators) do
    _results = Translator.translate(quote do: _results)
    variable_declaration = Translator.translate(quote do: _results = [])

    block_statement = [variable_declaration] ++ [handle_generators(generators)] ++ [Builder.return_statement(_results)]

    Builder.expression_statement(
      Builder.call_expression(
        Builder.function_expression([], [], Builder.block_statement(block_statement)),
        []
      )
    )
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
      [into: expression] ->
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
              Utils.make_array_accessor_call("_ref", index)
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
      Builder.identifier("Tuple"), 
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
      Builder.call_expression(
        Builder.member_expression(
          Builder.identifier("_results"),
          Builder.identifier("push")
        ),
        [param]
      )
    )
  end


  def make_try(try_block, rescue_clauses, after_block) do
    IO.inspect(try_block)
    Builder.try_statement(
      Builder.block_statement(List.wrap(
        Translator.translate(try_block)
      )),
      Builder.catch_clause(
        Builder.identifier(:e),
        Builder.block_statement([]) 
      ),
      Builder.block_statement(List.wrap(
        Translator.translate(after_block)
      )) 
    )
  end

  def make_try(try_block, rescue_clauses) do
    Builder.try_statement(
      Builder.block_statement(List.wrap(Translator.translate(try_block))),
      Builder.catch_clause(
        Builder.identifier(:e),
        Builder.block_statement(translate_rescue_clauses(rescue_clauses)) 
      ),
      nil
    )
  end

  def translate_rescue_clauses(clauses) do
    Enum.map(clauses, fn(x) ->
      case x do
        {:->, _, [[error_name], block]} ->
          {body, _} = PatternMatching.build_pattern_matched_body(
            List.wrap(Translator.translate(block)), 
            [error_name],
            fn(_index) ->
              Translator.translate(error_name)
            end, 
            nil
          )

          IO.inspect(body)
          hd(body)    
      end
    end)
  end

end