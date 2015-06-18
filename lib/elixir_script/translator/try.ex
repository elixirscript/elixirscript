defmodule ElixirScript.Translator.Try do
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.PatternMatching

  
  def make_try(try_block, _rescue_clauses, after_block) do
    IO.inspect(try_block)
    Builder.try_statement(
      Builder.block_statement(List.wrap(
        Translator.translate(try_block)
      )),
      Builder.catch_clause(
        Builder.identifier(:e),
        Builder.block_statement([]) 
      ),
      Builder.block_statement(List.wrap(
        Translator.translate(after_block)
      )) 
    )
  end

  def make_try(try_block, rescue_clauses) do
    Builder.try_statement(
      Builder.block_statement(List.wrap(Translator.translate(try_block))),
      Builder.catch_clause(
        Builder.identifier(:e),
        Builder.block_statement(translate_rescue_clauses(rescue_clauses)) 
      ),
      nil
    )
  end

  def translate_rescue_clauses(clauses) do
    Enum.map(clauses, fn(x) ->
      case x do
        {:->, _, [[error_name], block]} ->
          {body, _} = PatternMatching.build_pattern_matched_body(
            List.wrap(Translator.translate(block)), 
            [error_name],
            fn(_index) ->
              Translator.translate(error_name)
            end, 
            nil
          )

          IO.inspect(body)
          hd(body)    
      end
    end)
  end

end