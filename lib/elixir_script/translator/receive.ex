defmodule ElixirScript.Translator.Receive do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive

  def make_receive([do: clauses], env) do
    JS.yield_expression(
      JS.call_expression(
        JS.member_expression(
          Primitive.scheduler(),
          JS.identifier("receive")
        ),
        [
          JS.function_expression(
            [JS.identifier(:message)],
            [],
            JS.block_statement([
              JS.return_statement(
                ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses, env)
              )
            ])
          )
        ]
      )
    )
  end

  def make_receive([do: clauses, after: [{:->, _, [[time], _body]}] = after_clause], env) do
    JS.yield_expression(
      JS.call_expression(
        JS.member_expression(
          Primitive.scheduler(),
          JS.identifier("receive")
        ),
        [
          JS.function_expression(
            [JS.identifier(:message)],
            [],
            JS.block_statement([
              JS.return_statement(
                ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses, env)
              )
            ])
          ),
          Translator.translate(time, env),
          ElixirScript.Translator.Function.make_anonymous_function(after_clause, env)    
        ]
      )
    ) 
  end
end