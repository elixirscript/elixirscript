defmodule ElixirScript.Translator.Case do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  
  def make_case(condition, clauses) do
    Builder.expression_statement(
      Builder.call_expression(
        Builder.member_expression(
          Function.make_anonymous_function(clauses),
          Builder.identifier("call")
        ),
        [Translator.translate(condition)]
      )
    )
  end  
end