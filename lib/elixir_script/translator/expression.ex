defmodule ElixirScript.Translator.Expression do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator

  def make_unary_expression(operator, expr, env) do
    Builder.unary_expression(operator, true, Translator.translate(expr, env))
  end

  def make_binary_expression(operator, left, right, env) do
    Builder.binary_expression(operator, Translator.translate(left, env), Translator.translate(right, env))
  end

end