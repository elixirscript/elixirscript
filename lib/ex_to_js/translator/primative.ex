defmodule ExToJS.Translator.Primative do
  require Logger
  alias ESTree.Builder

  def make_identifier(ast) do
    Builder.identifier(ast)
  end

  def make_literal(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Builder.literal(ast)
  end

  def make_atom(ast) when is_atom(ast) do
    Builder.call_expression(
      Builder.identifier("Atom"), 
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
    Builder.call_expression(
      Builder.identifier("Tuple"), 
      Enum.map(elements, fn(x) -> ExToJS.Translator.translate(x) end)
    )
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
    do_make_interpolated_string(Enum.reverse(elements), nil)
  end

  def do_make_interpolated_string([], ast) do
    ast
  end

  def do_make_interpolated_string(elements, ast) do
    element_ast = case hd(elements) do
      elem when is_binary(elem) ->
        ExToJS.Translator.translate(elem)
      {:::, _, data} ->
        ExToJS.Translator.translate(hd(data))
    end

    case ast do
      nil ->
        do_make_interpolated_string(tl(elements), element_ast) 
      _ ->
        Builder.binary_expression(:+, element_ast, do_make_interpolated_string(tl(elements), ast))
    end
  end

end