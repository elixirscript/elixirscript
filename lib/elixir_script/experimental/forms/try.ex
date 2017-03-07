defmodule ElixirScript.Experimental.Forms.Try do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Experimental.Clause
  alias ElixirScript.Experimental.Form

  def compile(blocks) do
    try_block = Keyword.get(blocks, :do)
    rescue_block = Keyword.get(blocks, :rescue, nil)
    catch_block = Keyword.get(blocks, :catch, nil)
    after_block = Keyword.get(blocks, :after, nil)
    else_block = Keyword.get(blocks, :else, nil)

    translated_body = prepare_function_body(try_block)

    translated_body = JS.block_statement(translated_body)
    try_block = JS.function_expression([], [], translated_body)

    rescue_block = if rescue_block do
      process_rescue_block(rescue_block)
    else
      JS.identifier(:null)
    end

    catch_block = if catch_block do
      Form.compile({:fn, [], catch_block})
    else
      JS.identifier(:null)
    end

    after_block = if after_block do
      process_after_block(after_block)
    else
      JS.identifier(:null)
    end

    else_block = if else_block do
      Form.compile({:fn, [], else_block})
    else
      JS.identifier(:null)
    end

    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("SpecialForms")
          )
        ),
        JS.identifier("_try")
      ),
      [
        try_block,
        rescue_block,
        catch_block,
        else_block,
        after_block
      ]
    )

    js_ast
  end

  defp process_rescue_block(rescue_block) do
    processed_clauses = Enum.map(rescue_block, fn
      {:->, _, [ [{:in, _, [param, names]} = pattern], body]} ->
        Clause.compile({[], [param], [{{:., [], [Enum, :member?]}, [], [param, names]}], body})
      {:->, _, [ [param], body]} ->
        Clause.compile({[], [param], [], body})
      end)


      JS.call_expression(
        JS.member_expression(
          ElixirScript.Experimental.Function.patterns_ast(),
          JS.identifier("defmatch")
        ),
        processed_clauses
      )

  end

  defp process_after_block(after_block) do
    translated_body = prepare_function_body(after_block)
    translated_body = JS.block_statement(translated_body)

    JS.function_expression([], [], translated_body)
  end

  defp prepare_function_body(body) do
    body
    |> IO.inspect
    |> List.wrap
    |> Enum.map(&Form.compile(&1))
    |> Clause.return_last_statement
  end
end
