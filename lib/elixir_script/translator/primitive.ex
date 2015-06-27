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
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("atom")
      ),
      [Builder.literal(ast)]
    )
  end

  def make_list(ast) when is_list(ast) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("list")
      ),
      Enum.map(ast, fn(x) -> Translator.translate(x) end)
    )
  end

  def make_tuple({ one, two }) do
    make_tuple([one, two])
  end

  def make_tuple(elements) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("tuple")
      ),
      Enum.map(elements, fn(x) -> Translator.translate(x) end)
    )
  end

end
