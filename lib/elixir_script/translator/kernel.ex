defmodule ElixirScript.Translator.Kernel do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def make_range(first, last) do
    Builder.call_expression(
      Builder.identifier("Range"),
      [
        Translator.translate(first),
        Translator.translate(last)
      ]
    )
  end

  def make_bound(variable) do
    Utils.make_call_expression("Kernel", "bound", [variable])
  end

  def make_unquote(expr) do
      Builder.call_expression(
        Builder.function_expression([],[],
          Builder.block_statement([
            Builder.return_statement(
              Translator.translate(expr)
            )
          ])
        ),
        []
      )
  end

end