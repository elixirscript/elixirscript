defmodule ExToJS.Translator.PatternMatching do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator

  def make_assignment(left, right) do
    identifiers = Tuple.to_list(left)

    id = if is_atom(hd(identifiers)) do
      Builder.identifier(hd(identifiers))
    else
      Builder.array_pattern(Enum.map(identifiers, &Translator.translate(&1)))
    end

    declarator = Builder.variable_declarator(
      id,
      Translator.translate(right)
    )

    Builder.variable_declaration([declarator], :let)
  end

end