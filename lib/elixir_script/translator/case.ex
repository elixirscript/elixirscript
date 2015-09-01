defmodule ElixirScript.Translator.Case do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  
  def make_case(condition, clauses, env) do
    JS.call_expression(
      JS.member_expression(
        Function.make_anonymous_function(clauses, env),
        JS.identifier("call")
      ),
      [JS.identifier(:this), Translator.translate(condition)]
    )
  end  
end