defmodule ElixirScript.Translator.Kernel do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Utils

  def make_range(first, last) do
    Translator.translate(quote do: Range.(unquote(first), unquote(last)))
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


  def make___DIR__() do
    Utils.wrap_in_function_closure(
      Builder.if_statement(
        Builder.identifier(:__dirname),
        Builder.block_statement([
          Builder.return_statement(Builder.identifier(:__dirname))
        ]),
        Builder.block_statement([
          Builder.return_statement(Builder.literal(nil))
        ])      
      )
    )
  end

end