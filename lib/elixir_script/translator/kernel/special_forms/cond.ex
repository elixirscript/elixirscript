defmodule ElixirScript.Translator.Cond do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Function

  def make_cond(clauses, env) do
    js_ast = JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier("cond")
      ),
      process_cond(clauses, env)
    )

    { js_ast, env }
  end

  defp process_cond(clauses, env) do
    Enum.map(clauses, fn({:->, _, [clause, clause_body]}) ->
      { translated_body, env } = Function.prepare_function_body(clause_body, env)

      translated_body = JS.block_statement(translated_body)
      function = Function.function_ast([], translated_body)
      translated_clause = Translator.translate!(hd(clause), env)


      Primitive.make_list_no_translate([translated_clause, function])
    end)
  end

end
