defmodule ElixirScript.Translator.Primative do
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
      Enum.map(elements, fn(x) -> ElixirScript.Translator.translate(x) end)
    )
  end

  def make_bitstring(elements) do
    make_array_expression(elements)
  end

  defp make_array_expression(elements) do
    elements
    |> Enum.map(&ElixirScript.Translator.translate(&1))
    |> Builder.array_expression
  end

  def make_interpolated_string(elements) do
    translated_elements = Enum.map(elements, fn(x)->
      case x do
        elem when is_binary(elem) ->
          ElixirScript.Translator.translate(elem)
        {:::, _, data} ->
          ElixirScript.Translator.translate(hd(data))
      end
    end)

    do_make_interpolated_string(tl(translated_elements), hd(translated_elements))   
  end

  def do_make_interpolated_string([], ast) do
    ast
  end

  def do_make_interpolated_string(elements, ast) do
    Builder.binary_expression(
      :+,
      ast,
      do_make_interpolated_string(tl(elements), hd(elements))
    )
  end

end