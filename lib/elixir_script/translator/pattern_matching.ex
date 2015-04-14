defmodule ElixirScript.Translator.PatternMatching do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator

  def bind({_left1, _left2} = two_tuple, right) do
    do_tuple_bind(Tuple.to_list(two_tuple), right)
  end

  def bind({:{}, _, elements}, right) do
    do_tuple_bind(elements, right)
  end

  def bind(left, right) do
    identifiers = Tuple.to_list(left)

    declarator = Builder.variable_declarator(
      Builder.identifier(hd(identifiers)),
      Translator.translate(right)
    )

    Builder.variable_declaration([declarator], :let)
  end

  defp do_tuple_bind(left, right) do
    ref = Builder.identifier("_ref")

    declarator = Builder.variable_declarator(
      ref,
      Translator.translate(right)
    )

    declaration = Builder.variable_declaration([declarator], :let)

    pattern_declarator = left
    |> Enum.map(&ElixirScript.Translator.translate(&1))
    |> Builder.array_pattern()
    |> Builder.variable_declarator(
      Builder.member_expression(
        ref,
        Builder.identifier("value")
      )
    )

    pattern_declaration = Builder.variable_declaration([pattern_declarator], :let)

    Builder.block_statement([declaration] ++ [pattern_declaration])
  end

end