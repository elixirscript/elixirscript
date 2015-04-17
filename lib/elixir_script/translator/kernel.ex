defmodule ElixirScript.Translator.Kernel do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator

  def make_range(first, last) do
    Builder.call_expression(
      Builder.identifier("Range"),
      [
        Translator.translate(first),
        Translator.translate(last)
      ]
    )
  end

end