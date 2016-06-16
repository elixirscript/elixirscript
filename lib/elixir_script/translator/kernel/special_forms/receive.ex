
defmodule ElixirScript.Translator.Receive do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Spawn
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.LexicalScope


  def make_receive([do: clauses], %LexicalScope{ in_process: true} = env) do
    {made_case, _} = ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses, env)


    js = JS.yield_expression(
      Spawn.call_processes_func("receive", [
            JS.function_expression(
              [JS.identifier(:message)],
              [],
              JS.block_statement([
                JS.return_statement(
                  made_case
                )
              ])
            )
          ])
    )

    {js, env}
  end

  def make_receive([do: clauses], env) do
    {made_case, _} = ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses, env)

      js = Spawn.call_processes_func("receive", [
            JS.function_expression(
              [JS.identifier(:message)],
              [],
              JS.block_statement([
                JS.return_statement(
                  made_case
                )
              ])
            )
        ])

      {js, env}
  end

  def make_receive([do: clauses, after: [{:->, _, [[time], _body]}] = after_clause], %LexicalScope{ in_process: true } = env) do
    {made_case, _} = ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses, env)
    {anon_func, _} = ElixirScript.Translator.Function.make_anonymous_function(after_clause, env)

    js = JS.yield_expression(
      Spawn.call_processes_func("receive", [
            JS.function_expression(
              [JS.identifier(:message)],
              [],
              JS.block_statement([
                JS.return_statement(
                  made_case
                )
              ])
            ),
            Translator.translate!(time, env),
            anon_func
          ])
  )

    {js, env}
  end

  def make_receive([do: clauses, after: [{:->, _, [[time], _body]}] = after_clause], env) do
    {made_case, _} = ElixirScript.Translator.Case.make_case({:__aliases__, [], [:message]}, clauses, env)
    {anon_func, _} = ElixirScript.Translator.Function.make_anonymous_function(after_clause, env)


      js = Spawn.call_processes_func("receive", [
            JS.function_expression(
              [JS.identifier(:message)],
              [],
              JS.block_statement([
                JS.return_statement(
                  made_case
                )
              ])
            ),
            Translator.translate!(time, env),
            anon_func
      ])

      {js, env}
  end

end
