defmodule ElixirScript.Experimental.Function do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Clause

  @moduledoc """
  Translates the given Elixir function AST into the
  equivalent JavaScript AST. Function names are
  <name><arity>
  """

  def patterns_ast() do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier("Core")
      ),
      J.identifier("Patterns")
    )
  end

  def compile({{name, arity}, type, _, clauses}, state) do
    state = Map.put(state, :function, {name, arity})

    declarator = J.variable_declarator(
      ElixirScript.Translator.Identifier.make_function_name(name, arity),
      J.call_expression(
        J.member_expression(
          patterns_ast(),
          J.identifier("defmatch")
        ),
        Enum.map(clauses, &Clause.compile(&1, state))
      )
    )

    J.variable_declaration([declarator], :const)
  end
end
