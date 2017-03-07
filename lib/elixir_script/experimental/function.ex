defmodule ElixirScript.Experimental.Function do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Clause

  def patterns_ast() do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier("Core")
      ),
      J.identifier("Patterns")
    )
  end

  def compile({{name, arity}, type, _, clauses}) do
    clauses = Enum.map(clauses, fn(clause) ->
      Macro.prewalk(clause, fn
        {subject, context, params} ->
          {subject, Keyword.put(context, :function, {name, arity}), params }
        ast ->
          ast
      end)
    end)


    declarator = J.variable_declarator(
      J.identifier("#{name}#{arity}"),
      J.call_expression(
        J.member_expression(
          patterns_ast(),
          J.identifier("defmatch")
        ),
        Enum.map(clauses, &Clause.compile(&1))
      )
    )

    J.variable_declaration([declarator], :const)
  end
end
