defmodule ExToJS.Translator.Control do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator

  def make_block(expressions) do
    Builder.block_statement(Enum.map(expressions, &Translator.translate(&1)))
  end

  def make_if(test, blocks) do
    test = Translator.translate(test)

    consequent = Builder.block_statement([Translator.translate(blocks[:do])])

    alternate = if blocks[:else] != nil do
      Builder.block_statement([Translator.translate(blocks[:else])])
    else
      nil
    end

    Builder.if_statement(test, consequent, alternate)
  end

  def make_cond(clauses) do
    process_cond(clauses, nil)
  end

  def make_case(condition, clauses) do
    process_case(condition, clauses, nil)
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

    translated_clause = Translator.translate(hd(clause))

    if translated_clause.type == "Identifier" && translated_clause.name == :_ do
      translated_body
    else
      ast = Builder.if_statement(
        Builder.binary_expression(
          :==,
          Translator.translate(condition),
          translated_clause
        ),
        translated_body,
        nil
      )

      %ESTree.IfStatement{ ast |  alternate: process_case(condition, tl(clauses), nil) }
    end  
  end

end