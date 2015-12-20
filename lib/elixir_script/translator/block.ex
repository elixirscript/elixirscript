defmodule ElixirScript.Translator.Block do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator

  def make_block(expressions, env) do
    { list, env } = Enum.map_reduce(expressions, env, fn(x, updated_env) ->
       Translator.translate(x, updated_env)
    end)

    { Builder.block_statement(list), env }
  end

end
