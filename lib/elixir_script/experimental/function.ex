defmodule ElixirScript.Experimental.Function do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Clause  

  @patterns J.member_expression(
    J.member_expression(
      J.identifier("Bootstrap"),
      J.identifier("Core")
    ),
    J.identifier("Patterns")
  )

  def compile({{:__struct__, 0}, :def, _, clauses}) do
  end

  def compile({{:__struct__, 1}, :def, _, clauses}) do
  end

  def compile({{name, arity}, type, _, clauses}) do
    declarator = J.variable_declarator(
      J.identifier("#{name}#{arity}"),
      J.call_expression(
        J.member_expression(
          @patterns,
          J.identifier("defmatch")
        ),
        Enum.map(clauses, &Clause.compile(&1))
      )
    )

    J.variable_declaration([declarator], :const)
  end
end