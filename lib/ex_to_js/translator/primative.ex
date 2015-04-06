defmodule ExToJS.Translator.Primative do
  require Logger
  alias ESTree.Builder

  def make_identifier(ast) do
    Builder.identifier(ast)
  end

  def make_literal(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Builder.literal(ast)
  end

  def make_symbol(ast) when is_atom(ast) do
    Builder.call_expression(
      Builder.identifier("Symbol"), 
      [Builder.literal(ast)]
    )
  end

  def make_array(ast) when is_list(ast) do
    make_array_expression(ast)
  end

  def make_tuple({ one, two }) do
    make_tuple([one, two])
  end

  def make_tuple(elements) do
    {elems, _} = Enum.map_reduce(elements, 0, fn(x, index) ->
      {
        Builder.property(Builder.literal("_#{index}"), ExToJS.Translator.translate(x)),
        index + 1
      }
    end)

    Builder.object_expression(elems)
  end

  def make_bitstring(elements) do
    make_array_expression(elements)
  end

  defp make_array_expression(elements) do
    elements
    |> Enum.map(&ExToJS.Translator.translate(&1))
    |> Builder.array_expression
  end

  def make_interpolated_string(elements) do
    {strings, expressions} = Enum.partition(elements, fn(x) -> is_binary(x) end)

    Builder.template_literal(
      Enum.map(strings, fn(x) ->
        Builder.template_element(x, x, false)
      end),
      Enum.map(expressions, fn({:::, _, data}) ->
        hd(data) 
        |> elem(0) 
        |> ExToJS.Translator.translate
      end)
    )
  end

end