defmodule ElixirScript.Translator.Bitstring do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator

  
  def make_bitstring(elements, env) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.member_expression(
          Builder.identifier("Kernel"),
          Builder.identifier("SpecialForms")
        ),
        Builder.identifier("bitstring")
      ),
      Enum.map(elements, &make_bitstring_element(&1, env))
    )
  end

  defp make_bitstring_element(element, env) when is_number(element) do
    do_make_bitstring_element({:integer, Translator.translate(element, env)})   
  end

  defp make_bitstring_element(element, env) when is_binary(element) do
    do_make_bitstring_element({:binary, Translator.translate(element, env)})     
  end

  defp make_bitstring_element({:<<>>, [], elements}, env) do
    make_bitstring(elements, env)
  end

  defp make_bitstring_element({:::, _, [element, {type, _, _}]}, env) when type in [:integer, :float, :bitstring, :bits, :binary, :bytes, :utf8, :utf16, :utf32] do
    do_make_bitstring_element({type, Translator.translate(element, env)})    
  end

  defp make_bitstring_element({:::, _, [element, {type, _, params}]}, env) when type in [:size, :unit] do
    do_make_bitstring_element({type, Translator.translate(element, env), Enum.map(params, &Translator.translate(&1, env))})   
  end

  defp make_bitstring_element({:::, _, [element, {:*, _, [size, unit]}]}, env) do
    size_ast = do_make_bitstring_element({:size, Translator.translate(element, env), [Translator.translate(size, env)]})
    do_make_bitstring_element({:unit, size_ast, [Translator.translate(unit, env)]})  
  end

  defp make_bitstring_element({:::, _, [element, {:-, _, types}]}, env) do
    handle_type_adjectives({:-, [], types}, Translator.translate(element, env), env)  
  end

  defp make_bitstring_element({:::, _, [element, size]}, env) do
    do_make_bitstring_element({:size, Translator.translate(element, env), [Translator.translate(size, env)]})  
  end

  defp handle_type_adjectives({:-, _, types}, ast, env) do
    Enum.reduce(types, ast, fn(type, current_ast) ->
      case type do
        {:-, _, sub_types} ->
          handle_type_adjectives({:-, [], sub_types}, current_ast, env)
        {:*, _, [size, unit]} ->
          size_ast = do_make_bitstring_element({:size, current_ast, [Translator.translate(size, env)]})
          do_make_bitstring_element({:unit, size_ast, [Translator.translate(unit, env)]})
        {the_type, _, params} when is_list(params) ->
          do_make_bitstring_element({the_type, current_ast, Enum.map(params, &Translator.translate(&1, env))})
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

  def make_interpolated_string(elements, env) do
    translated_elements = Enum.map(elements, fn(x)->
      case x do
        elem when is_binary(elem) ->
          Translator.translate(elem, env)
        {:::, _, data} ->
          Translator.translate(hd(data), env)
      end
    end)

    do_make_interpolated_string(tl(translated_elements), hd(translated_elements), env)   
  end

  def do_make_interpolated_string([], ast, _) do
    ast
  end

  def do_make_interpolated_string(elements, ast, env) do
    Builder.binary_expression(
      :+,
      ast,
      do_make_interpolated_string(tl(elements), hd(elements), env)
    )
  end

end