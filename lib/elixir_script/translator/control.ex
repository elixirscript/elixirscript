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
        i = Translator.translate(identifier)
        variable_declarator = Builder.variable_declarator(i)
        variable_declaration = Builder.variable_declaration([variable_declarator], :let)

        Builder.for_of_statement(
          variable_declaration,
          Translator.translate(enum),
          handle_generators(tl(generators))
        )
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

end