defmodule ExToJS.Translator.Kernel do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator

  def make_in(left, right) do
    Builder.call_expression(
      Builder.member_expression(
        Translator.translate(right),
        Builder.identifier(:includes)
      ),
      [Translator.translate(left)]
    )
  end

end