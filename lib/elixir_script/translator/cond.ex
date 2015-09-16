defmodule ElixirScript.Translator.Cond do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils

  def make_cond(clauses, env) do
    process_cond(clauses, nil, env)
    |> Utils.wrap_in_function_closure()
  end

  defp process_cond([], ast, env) do
    ast
  end

  defp process_cond(clauses, ast, env) do
    {:->, _, [clause, clause_body]} = hd(clauses)

    translated_body = Translator.translate(clause_body, env)

    if translated_body.type != "BlockStatement" do
      translated_body = Builder.block_statement([translated_body])
    end

    translated_body = Builder.block_statement(Utils.inflate_groups(translated_body.body))
    translated_body = Function.return_last_expression(translated_body)

    if hd(clause) == true do
      translated_body   
    else
      ast = Builder.if_statement(
        Translator.translate(hd(clause), env),
        translated_body,
        nil
      )

      %ESTree.IfStatement{ ast |  alternate: process_cond(tl(clauses), nil, env) }
    end
  end
  
end