defmodule ElixirScript.Translator.Bitstring do
  alias ESTree.Builder
  alias ElixirScript.Translator

  
  def make_bitstring(elements) do
    Builder.call_expression(
      Builder.identifier("BitString"), 
      Enum.map(elements, &make_bitstring_element(&1))
    )
  end

  defp make_bitstring_element(element) when is_number(element) do
    do_make_bitstring_element({:integer, Translator.translate(element)})   
  end

  defp make_bitstring_element(element) when is_binary(element) do
    do_make_bitstring_element({:binary, Translator.translate(element)})     
  end

  defp make_bitstring_element({:<<>>, [], elements}) do
    make_bitstring(elements)
  end

  defp make_bitstring_element({:::, _, [element, {type, _, _}]}) when type in [:integer, :float, :bitstring, :bits, :binary, :bytes, :utf8, :utf16, :utf32] do
    do_make_bitstring_element({type, Translator.translate(element)})    
  end

  defp make_bitstring_element({:::, _, [element, {type, _, params}]}) when type in [:size, :unit] do
    do_make_bitstring_element({type, Translator.translate(element), Enum.map(params, &Translator.translate(&1))})   
  end

  defp make_bitstring_element({:::, _, [element, {:*, _, [size, unit]}]}) do
    size_ast = do_make_bitstring_element({:size, Translator.translate(element), [Translator.translate(size)]})
    do_make_bitstring_element({:unit, size_ast, [Translator.translate(unit)]})  
  end

  defp make_bitstring_element({:::, _, [element, {:-, _, types}]}) do
    handle_type_adjectives({:-, [], types}, Translator.translate(element))  
  end

  defp make_bitstring_element({:::, _, [element, size]}) do
    do_make_bitstring_element({:size, Translator.translate(element), [Translator.translate(size)]})  
  end

  defp handle_type_adjectives({:-, _, types}, ast) do
    Enum.reduce(types, ast, fn(type, current_ast) ->
      case type do
        {:-, _, sub_types} ->
          handle_type_adjectives({:-, [], sub_types}, current_ast)
        {:*, _, [size, unit]} ->
          size_ast = do_make_bitstring_element({:size, current_ast, [Translator.translate(size)]})
          do_make_bitstring_element({:unit, size_ast, [Translator.translate(unit)]})
        {the_type, _, params} when is_list(params) ->
          do_make_bitstring_element({the_type, current_ast, Enum.map(params, &Translator.translate(&1))})
        {the_type, _, _} ->
          do_make_bitstring_element({the_type, current_ast})
      end
    end)
  end

  defp do_make_bitstring_element({type, ast}) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("BitString"),
        Builder.identifier(type)
      ),
      [
        ast
      ]
    ) 
  end

  defp do_make_bitstring_element({type, ast, params}) when is_list(params) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("BitString"),
        Builder.identifier(type)
      ),
      [
        ast
      ] ++ params
    ) 
  end

  def make_interpolated_string(elements) do
    translated_elements = Enum.map(elements, fn(x)->
      case x do
        elem when is_binary(elem) ->
          Translator.translate(elem)
        {:::, _, data} ->
          Translator.translate(hd(data))
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