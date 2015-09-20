defmodule ElixirScript.Translator.Cond do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive

  def make_cond(clauses, env) do
    processed_clauses = Enum.map(clauses, fn({:->, _, [clause, clause_body]}) ->
      Primitive.make_list_no_translate([
        Translator.translate(hd(clause), env),
        Translator.translate(clause_body, env)
      ])
    end)

    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Kernel"),
          JS.identifier("SpecialForms")
        ),
        JS.identifier("cond")
      ),
      processed_clauses
    )
  end
  
end