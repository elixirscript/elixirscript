defmodule ElixirScript.Translator.Case do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function

  def make_case(condition, clauses, env) do
    { func, env } = Function.make_anonymous_function(clauses, env)

    js_ast = JS.call_expression(
      JS.member_expression( func, JS.identifier("call")),
      [JS.identifier(:this), Translator.translate!(condition, env)]
    )

    { js_ast, env }
  end
end
