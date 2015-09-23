defmodule ElixirScript.Translator.Cond do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils

  def make_cond(clauses, env) do
    JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier("cond")
      ),
      process_cond(clauses, env)
    )
  end

  defp process_cond(clauses, env) do
    Enum.map(clauses, fn({:->, _, [clause, clause_body]}) ->
      translated_body = Function.prepare_function_body(clause_body, env) |> JS.block_statement
      function = JS.function_expression([], [], translated_body)
      translated_clause = Translator.translate(hd(clause), env)


      Primitive.make_list_no_translate([translated_clause, function])
    end)
  end
  
end