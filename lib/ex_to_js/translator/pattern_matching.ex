defmodule ExToJS.Translator.PatternMatching do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator

  def bind({left1, left2}, right) do
    id = Builder.object_pattern(
      [
        Builder.object_pattern_property(Builder.literal("_0"), ExToJS.Translator.translate(left1)),
        Builder.object_pattern_property(Builder.literal("_1"), ExToJS.Translator.translate(left2)),
      ]
    )

    declarator = Builder.variable_declarator(
      id,
      Translator.translate(right)
    )

    Builder.variable_declaration([declarator], :let)
  end

  def bind({:{}, _, elements}, right) do
    {elems, _} = Enum.map_reduce(elements, 0, fn(x, index) ->
      {
        Builder.object_pattern_property(Builder.literal("_#{index}"), ExToJS.Translator.translate(x)),
        index + 1
      }
    end)

    declarator = Builder.variable_declarator(
      Builder.object_pattern(elems),
      Translator.translate(right)
    )

    Builder.variable_declaration([declarator], :let)
  end

  def bind(left, right) do
    identifiers = Tuple.to_list(left)

    declarator = Builder.variable_declarator(
      Builder.identifier(hd(identifiers)),
      Translator.translate(right)
    )

    Builder.variable_declaration([declarator], :let)
  end

end