defmodule ElixirScript.Translator.If do
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils

  def make_if(test, blocks) do
    test = Translator.translate(test)

    consequent = Builder.block_statement([Translator.translate(blocks[:do])])
    |> Function.return_last_expression

    alternate = case blocks[:else] do
      nil ->
        nil
      _ ->
        Builder.block_statement([Translator.translate(blocks[:else])])
        |> Function.return_last_expression        
    end

    Builder.if_statement(test, consequent, alternate)
    |> Utils.wrap_in_function_closure()

  end
end