defmodule ElixirScript.Translator.Primitive do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator

  def make_identifier(ast) do
    Builder.identifier(ast)
  end

  def make_literal(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Builder.literal(ast)
  end

  def make_atom(ast) when is_atom(ast) do
    Builder.call_expression(
      Builder.identifier("Atom"), 
      [Builder.literal(ast)]
    )
  end

  def make_list(ast) when is_list(ast) do
    Builder.call_expression(
      Builder.identifier("List"), 
      Enum.map(ast, fn(x) -> Translator.translate(x) end)
    )
  end

  def make_tuple({ one, two }) do
    make_tuple([one, two])
  end

  def make_tuple(elements) do
    Builder.call_expression(
      Builder.identifier("Tuple"), 
      Enum.map(elements, fn(x) -> Translator.translate(x) end)
    )
  end

end
