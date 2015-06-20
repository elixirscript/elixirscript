defmodule ElixirScript.Translator.Case do
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.PatternMatching
  
  def make_case(condition, clauses) do
    process_case(condition, clauses, nil)
    |> Utils.wrap_in_function_closure()
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

  
end