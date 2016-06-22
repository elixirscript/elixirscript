defmodule ElixirScript.Translator.Try do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Primitive

  def make_try(blocks, env) do
    try_block = Dict.get(blocks, :do)
    rescue_block = Dict.get(blocks, :rescue, nil)
    catch_block = Dict.get(blocks, :catch, nil)
    after_block = Dict.get(blocks, :after, nil)
    else_block = Dict.get(blocks, :else, nil)

    { translated_body, _ } = Function.prepare_function_body(try_block, env)

    translated_body = JS.block_statement(translated_body)
    try_block = JS.function_expression([], [], translated_body)

    rescue_block = if rescue_block do
      process_rescue_block(rescue_block, env)
    else
      JS.identifier(:null)
    end

    catch_block = if catch_block do
      process_catch_block(catch_block, env)
    else
      JS.identifier(:null)
    end

    after_block = if after_block do
      process_after_block(after_block, env)
    else
      JS.identifier(:null)
    end

    else_block = if else_block do
      Function.make_anonymous_function(else_block, env)
      |> elem(0)
    else
      JS.identifier(:null)
    end

    js_ast = JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
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

    { js_ast, env }
  end

  defp process_rescue_block(rescue_block, env) do
    { func, _ } = Enum.map(rescue_block, fn(x) ->
      case x do
        {:->, _, [[{value, _, module}], block]} when not is_list(module) ->
          {:->, [], [[{value, [], convert_to_struct(module)}], block]}
        {:->, _, [[{:in, meta, [value, error_names]}], block]} ->
          error_names = Enum.map(error_names, fn(x) ->
            convert_to_struct(x)
          end)

          guards = {:in, meta, [value, error_names]}

          {:->, [], [ [{:when, [], [value | [guards]]}], block ]}
        {:->, _, [error_names, block]} ->
          Enum.map(error_names, fn(x) ->
            {:->, [], [[convert_to_struct(x)], block]}
          end)
      end
    end)
    |> List.flatten
    |> Function.make_anonymous_function(env)

    func
  end

  defp process_catch_block(catch_block, env) do
    {func, _} = catch_block
    |> Function.make_anonymous_function(env)

    func
  end

  defp process_after_block(after_block, env) do
    { translated_body, _ } = Function.prepare_function_body(after_block, env)
    translated_body = JS.block_statement(translated_body)

    JS.function_expression([], [], translated_body)
  end

  defp convert_to_struct([module]) do
    convert_to_struct(module)
  end

  defp convert_to_struct(module) do
    case module do
      {:__aliases__, _, _}  = alias_ast->
        {:%, [], [alias_ast, {:%{}, [], []}]}
      ast ->
        ast
    end
  end
end
