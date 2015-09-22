defmodule ElixirScript.Translator.Try do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Case
  alias ElixirScript.Translator.Utils

  @error_identifier JS.identifier(:e)

  def make_try(blocks, env) do
    try_block = Dict.get(blocks, :do)
    rescue_block = Dict.get(blocks, :rescue, nil)
    catch_block = Dict.get(blocks, :catch, nil)
    after_block = Dict.get(blocks, :after, nil)
    else_block = Dict.get(blocks, :else, nil)

    translated_body = Function.prepare_function_body(try_block, env) |> JS.block_statement
    try_block = JS.function_expression([], [], translated_body)

    if rescue_block do
      rescue_block = process_rescue_block(rescue_block, env)
    else
      rescue_block = JS.identifier(:null)
    end

    if catch_block do
      catch_block = process_catch_block(catch_block, env)
    else
      catch_block = JS.identifier(:null)
    end

    if after_block do
      after_block = process_after_block(after_block, env)
    else
      after_block = JS.identifier(:null)
    end

    if else_block do
      else_block = Function.make_anonymous_function(else_block, env)
    else
      else_block = JS.identifier(:null)
    end

    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Kernel"),
          JS.identifier("SpecialForms")
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

  end

  defp process_rescue_block(rescue_block, env) do
    Enum.map(rescue_block, fn(x) ->
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
  end

  defp process_catch_block(catch_block, env) do
    catch_block
    |> Function.make_anonymous_function(env)
  end

  defp process_after_block(after_block, env) do
      translated_body = Function.prepare_function_body(after_block, env) |> JS.block_statement
      JS.function_expression([], [], translated_body)
  end

  defp convert_to_struct([module]) do
    convert_to_struct(module)
  end

  defp convert_to_struct(module) do
    case module do
      {:__aliases__, _, _}  = _alias->
        {:%, [], [_alias, {:%{}, [], []}]}
      ast ->
        ast
    end
  end
end