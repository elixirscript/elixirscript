defmodule ElixirScript.Translator.Try do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Function
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
          value_declarator = JS.variable_declarator(
            JS.identifier(value),
            @error_identifier
          )

          value_declaration = JS.variable_declaration([value_declarator], :let)
          block = [value_declaration] ++ List.wrap(Translator.translate(block))
          JS.if_statement(JS.literal(true), JS.block_statement(block))
        {:->, _, [[{:in, meta, [value, error_names]}], block]} ->
          error_names = Enum.map(error_names, fn
            ({:__aliases__, _, name}) ->
              {:%{}, [], [__struct__: name]}
            (ast) ->
              ast
          end)

          {body, _} = PatternMatching.build_pattern_matched_body(
            List.wrap(Translator.translate(block)), 
            [],
            fn(_index) ->
              @error_identifier
            end, 
            [{:in, meta, [value, error_names]}] 
          )

          hd(body)
        {:->, _, [[error_name], block]} ->
          {body, _} = PatternMatching.build_pattern_matched_body(
            List.wrap(Translator.translate(block)), 
            List.wrap(error_name),
            fn(_index) ->
              @error_identifier
            end, 
            nil
          )

          hd(body)    
      end
    end)
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
    Enum.map(catch_block, fn(x) ->
      case x do
        {:->, [], [[:throw, value], block]} ->
          JS.if_statement(
            JS.binary_expression(:instanceof, @error_identifier, JS.identifier(value)),
            JS.block_statement(List.wrap(Translator.translate(block)))
          )
        [{:->, [], [[value], block]}] ->
          value_declarator = JS.variable_declarator(
            JS.identifier(value),
            @error_identifier
          )

          value_declaration = JS.variable_declaration([value_declarator], :let)
          block = [value_declaration] ++ List.wrap(Translator.translate(block))
          JS.if_statement(JS.literal(true), JS.block_statement(block))
      end
    end)
  end

  def process_rescue_and_catch([], []) do
    nil
  end

  def process_rescue_and_catch(processed_rescue_block, processed_catch_block) do
    processed_clauses = processed_catch_block ++ processed_rescue_block

    processed_clauses
    |> Enum.reverse
    |> Enum.reduce(JS.block_statement([JS.throw_statement(@error_identifier)]), fn(x, ast) ->
        %{x | consequent: Function.return_last_expression(x.consequent), alternate: ast }
    end)
    |> List.wrap
  end
end