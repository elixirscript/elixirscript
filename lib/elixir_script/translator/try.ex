defmodule ElixirScript.Translator.Try do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Case
  alias ElixirScript.Translator.Utils

  @error_identifier JS.identifier(:e)

  def make_try(blocks) do
    try_block = Dict.get(blocks, :do)
    rescue_block = Dict.get(blocks, :rescue)
    catch_block = Dict.get(blocks, :catch)
    after_block = Dict.get(blocks, :after)
    else_block = Dict.get(blocks, :else)

    if(else_block != nil) do
      raise ElixirScript.UnsupportedError, "try with else block"
    end

    processed_rescue_and_catch_blocks = process_rescue_and_catch(
      process_rescue_block(rescue_block),
      process_catch_block(catch_block)
    )

    the_catch = case processed_rescue_and_catch_blocks do
      nil ->
        nil
      blocks ->
        JS.catch_clause(@error_identifier, 
          JS.block_statement(List.wrap(blocks))
        )
    end

    Utils.wrap_in_function_closure(
      JS.try_statement(
        Function.return_last_expression(
          JS.block_statement(List.wrap(Translator.translate(try_block)))
        ),
        the_catch,
        Function.return_last_expression(process_after_block(after_block))
      )
    )
  end

  defp process_rescue_block(nil) do
    []
  end

  defp process_rescue_block(rescue_block) do
    Enum.map(rescue_block, fn(x) ->
      case x do
        {:->, _, [[{value, _, module} = ast], block]} when not is_list(module) ->
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
  end

  defp process_after_block(nil) do
    nil
  end

  defp process_after_block(after_block) do
    JS.block_statement(List.wrap(
      Translator.translate(after_block)
    ))
  end

  defp process_catch_block(nil) do
    []
  end

  defp process_catch_block(catch_block) do
    catch_block
  end

  def process_rescue_and_catch([], []) do
    nil
  end

  def process_rescue_and_catch(processed_rescue_block, processed_catch_block) do
    processed_clauses = processed_catch_block ++ processed_rescue_block
    processed_clauses = processed_clauses ++ [{:->, [], [[], [quote do: throw(e)]]}]
    Case.make_case({:e, [], __MODULE__}, processed_clauses)
  end

  defp convert_to_struct([module]) do
    convert_to_struct(module)
  end

  defp convert_to_struct(module) do
    case module do
      {:__aliases__, meta, name}  = _alias->
        {:%, [], [_alias, {:%{}, [], []}]}
      ast ->
        ast
    end
  end
end