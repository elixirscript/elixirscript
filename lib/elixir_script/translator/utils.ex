defmodule ElixirScript.Translator.Utils do
  alias ESTree.Builder
  alias ElixirScript.Translator


  def make_throw_statement(error_name, message) do
    Builder.throw_statement(
      Builder.new_expression(
        Builder.identifier(error_name),
        [
          Builder.literal(message)
        ]
      )
    )
  end

  def make_call_expression(module_name, function_name, params) do
    Builder.call_expression(
      make_member_expression(module_name, function_name),
      Enum.map(params, &Translator.translate(&1))
    )
  end


  def make_member_expression(module_name, function_name) do
    Builder.member_expression(
      Builder.identifier(module_name),
      Builder.identifier(function_name)
    )
  end

  def wrap_in_function_closure(body) do
    the_body = case body do
      b when is_list(b) ->
        b
      _ ->
        [body]
    end

    Builder.expression_statement(
      Builder.call_expression(
        Builder.function_expression([],[],
          Builder.block_statement(the_body)
        ),
        []
      )
    )
  end

  def make_match(pattern, expr) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Kernel"),
        Builder.identifier("match")
      ),
      [
        pattern,
        expr
      ]
    )
  end

end