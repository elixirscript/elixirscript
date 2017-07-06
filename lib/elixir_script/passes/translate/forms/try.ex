defmodule ElixirScript.Translate.Forms.Try do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translate.{Form, Function, Clause}

  def compile(blocks, state) do
    try_block = Keyword.get(blocks, :do)
    rescue_block = Keyword.get(blocks, :rescue, nil)
    catch_block = Keyword.get(blocks, :catch, nil)
    after_block = Keyword.get(blocks, :after, nil)
    else_block = Keyword.get(blocks, :else, nil)

    translated_body = prepare_function_body(try_block, state)

    translated_body = JS.block_statement(translated_body)
    try_block = JS.arrow_function_expression([], [], translated_body)

    rescue_block = if rescue_block do
      process_rescue_block(rescue_block, state)
    else
      JS.identifier(:null)
    end

    catch_block = if catch_block do
      Form.compile!({:fn, [], catch_block}, state)
    else
      JS.identifier(:null)
    end

    after_block = if after_block do
      process_after_block(after_block, state)
    else
      JS.identifier(:null)
    end

    else_block = if else_block do
      Form.compile!({:fn, [], else_block}, state)
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

    { js_ast, state }
  end

  defp process_rescue_block(rescue_block, state) do
    processed_clauses = Enum.map(rescue_block, fn
      {:->, _, [ [{:in, _, [param, names]}], body]} ->
        {ast, _} = Clause.compile({[], [param], [{{:., [], [Enum, :member?]}, [], [param, names]}], body}, state)
        ast
      {:->, _, [ [param], body]} ->
        {ast, _} = Clause.compile({[], [param], [], body}, state)
        ast
      end)


      JS.call_expression(
        JS.member_expression(
          ElixirScript.Translate.Function.patterns_ast(),
          JS.identifier("defmatch")
        ),
        processed_clauses
      )

  end

  defp process_after_block(after_block, state) do
    translated_body = prepare_function_body(after_block, state)
    translated_body = JS.block_statement(translated_body)

    JS.arrow_function_expression([], [], translated_body)
  end

  defp prepare_function_body(body, state) do
    {ast, _} = Function.compile_block(body, state)

    Clause.return_last_statement(ast)
  end
end
