defmodule ElixirScript.Translator.Block do
  alias ESTree.Builder
  alias ElixirScript.Translator

  def make_block(expressions) do
    Builder.block_statement(Enum.map(expressions, &Translator.translate(&1)))
  end

end