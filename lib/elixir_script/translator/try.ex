defmodule ElixirScript.Translator.Try do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.PatternMatching

  @error_identifier JS.identifier(:e)

  def make_try([do: try_block, rescue: rescue_clauses]) do
    JS.try_statement(
      JS.block_statement(List.wrap(Translator.translate(try_block))),
      JS.catch_clause(
        @error_identifier,
        JS.block_statement(translate_rescue_clauses(rescue_clauses)) 
      ),
      nil
    )
  end

  def make_try([do: try_block, after: after_block]) do
    JS.try_statement(
      JS.block_statement(List.wrap(
        Translator.translate(try_block)
      )),
      nil,
      JS.block_statement(List.wrap(
        Translator.translate(after_block)
      )) 
    )
  end
  
  def make_try([do: try_block, rescue: rescue_clauses, after: after_block]) do
    JS.try_statement(
      JS.block_statement(List.wrap(
        Translator.translate(try_block)
      )),
      JS.catch_clause(
        @error_identifier,
        JS.block_statement(translate_rescue_clauses(rescue_clauses)) 
      ),
      JS.block_statement(List.wrap(
        Translator.translate(after_block)
      )) 
    )
  end

  def make_try(blocks) do
    raise ElixirScript.UnsupportedError, "else and catch blocks"
  end

  def translate_rescue_clauses(clauses) do
    translated = Enum.map(clauses, fn(x) ->
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
    |> Enum.reverse
    |> Enum.reduce(JS.block_statement([JS.throw_statement(@error_identifier)]), fn(x, ast) ->
        %{x | alternate: ast }
    end)

    List.wrap(translated)
  end
end