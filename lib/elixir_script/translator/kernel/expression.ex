defmodule ElixirScript.Translator.Expression do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator

  def make_unary_expression(operator, expr, env) do
    { js_ast, env } = Translator.translate(expr, env)
    { Builder.unary_expression(operator, true, js_ast), env }
  end

  def make_binary_expression(operator, left, right, env) do
    { left, _ } = Translator.translate(left, env)
    { right, _ } = Translator.translate(right, env)

    { Builder.binary_expression(operator, left, right), env }
  end

end
