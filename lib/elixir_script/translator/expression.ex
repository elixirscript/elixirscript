defmodule ElixirScript.Translator.Expression do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator

  def make_negative_number(number) do
    Builder.unary_expression(:-, true, Builder.literal(number))
  end

  def make_binary_expression(operator, left, right) do
    Builder.binary_expression(operator, Translator.translate(left), Translator.translate(right))
  end

end