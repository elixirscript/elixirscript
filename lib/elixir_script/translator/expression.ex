defmodule ElixirScript.Translator.Expression do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator

  def make_unary_expression(operator, expr) do
    Builder.unary_expression(operator, true, Translator.translate(expr))
  end

  def make_binary_expression(operator, left, right) do
    Builder.binary_expression(operator, Translator.translate(left), Translator.translate(right))
  end

end