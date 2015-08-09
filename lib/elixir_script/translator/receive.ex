defmodule ElixirScript.Translator.Receive do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  def make_receive([do: clauses]) do
    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Kernel"),
          JS.identifier("SpecialForms")
        ),
        JS.identifier("receive")
      ),
      [
        JS.function_expression(
          [JS.identifier(:message)],
          [],
          JS.block_statement([
            JS.return_statement(
              ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses)
            )
          ])
        )
      ]
    )
  end

  def make_receive([do: clauses, after: [{:->, _, [[time], _body]}] = after_clause]) do
    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Kernel"),
          JS.identifier("SpecialForms")
        ),
        JS.identifier("receive")
      ),
      [
        JS.function_expression(
          [JS.identifier(:message)],
          [],
          JS.block_statement([
            JS.return_statement(
              ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses)
            )
          ])
        ),
        Translator.translate(time),
        ElixirScript.Translator.Function.make_anonymous_function(after_clause)    
      ]
    ) 
  end
end