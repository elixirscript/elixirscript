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

end