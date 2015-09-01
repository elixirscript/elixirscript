defmodule ElixirScript.Translator.Block do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator

  def make_block(expressions, env) do
    Builder.block_statement(Enum.map(expressions, &Translator.translate(&1, env)))
  end

end