defmodule ElixirScript.Translator.Bitstring do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator


  def make_bitstring(elements, env) do
    js_ast = JS.new_expression(
        JS.member_expression(
          JS.member_expression(
            JS.identifier(:Bootstrap),
            JS.identifier("Core")
          ),
          JS.identifier("BitString")
        ),
        Enum.map(elements, &make_bitstring_element(&1, env))
      )

    { js_ast, env }
  end

  def make_bitstring_element(element, env) when is_number(element) do
    do_make_bitstring_element({:integer, Translator.translate!(element, env)})
  end

  def make_bitstring_element(element, env) when is_binary(element) do
    do_make_bitstring_element({:binary, Translator.translate!(element, env)})
  end

  def make_bitstring_element({:<<>>, [], elements}, env) do
    {ast, _} = make_bitstring(elements, env)
    ast
  end

  def make_bitstring_element({:::, _, [element, {type, _, _}]}, env) when type in [:integer, :float, :bitstring, :bits, :binary, :bytes, :utf8, :utf16, :utf32, :signed, :unsigned] do
    do_make_bitstring_element({type, translate_element(element, env)})
  end

  def make_bitstring_element({:::, _, [element, {type, _, params}]}, env) when type in [:size, :unit] do
    do_make_bitstring_element({type, translate_element(element, env), Enum.map(params, &translate_element(&1, env))})
  end

  def make_bitstring_element({:::, _, [element, {:*, _, [size, unit]}]}, env) do
    size_ast = do_make_bitstring_element({:size, translate_element(element, env), [translate_element(size, env)]})
    do_make_bitstring_element({:unit, size_ast, [translate_element(unit, env)]})
  end

  def make_bitstring_element({:::, _, [element, {:-, _, types}]}, env) do
    handle_type_adjectives({:-, [], types}, translate_element(element, env), env)
  end

  def make_bitstring_element({:::, _, [element, size]}, env) do
    do_make_bitstring_element({:size, translate_element(element, env), [translate_element(size, env)]})
  end

  def make_bitstring_element(element, env) do
    do_make_bitstring_element({:binary, translate_element(element, env)})
  end

  def translate_element(ElixirScript.Translator.PatternMatching, _) do
    JS.object_expression([JS.property(
                                      JS.literal("value"),
                                      ElixirScript.Translator.PatternMatching.parameter()
                           )
                         ])
  end

  def translate_element(element, env) do
    Translator.translate!(element, env)
  end

  defp handle_type_adjectives({:-, _, types}, ast, env) do
    Enum.reduce(types, ast, fn(type, current_ast) ->
      case type do
        {:-, _, sub_types} ->
          handle_type_adjectives({:-, [], sub_types}, current_ast, env)
        {:*, _, [size, unit]} ->
          size_ast = do_make_bitstring_element({:size, current_ast, [Translator.translate!(size, env)]})
          do_make_bitstring_element({:unit, size_ast, [Translator.translate!(unit, env)]})
        {the_type, _, params} when is_list(params) ->
          do_make_bitstring_element({the_type, current_ast, Enum.map(params, &Translator.translate!(&1, env))})
        {the_type, _, _} ->
          do_make_bitstring_element({the_type, current_ast})
      end
    end)
  end

  defp bitstring_class() do
    JS.member_expression(
      JS.member_expression(
        JS.identifier(:Bootstrap),
        JS.identifier("Core")
      ),
      JS.identifier("BitString")
    )
  end

  defp do_make_bitstring_element({type, ast}) do
    JS.call_expression(
      JS.member_expression(
        bitstring_class,
        JS.identifier(type)
      ),
      [
        ast
      ]
    )
  end

  defp do_make_bitstring_element({type, ast, params}) when is_list(params) do
    JS.call_expression(
      JS.member_expression(
        bitstring_class,
        JS.identifier(type)
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
          Translator.translate!(elem, env)
        {:::, _, data} ->
          Translator.translate!(hd(data), env)
      end
    end)

    { do_make_interpolated_string(tl(translated_elements), hd(translated_elements), env), env }
  end

  defp do_make_interpolated_string([], ast, _) do
    ast
  end

  defp do_make_interpolated_string(elements, ast, env) do
    JS.binary_expression(
      :+,
      ast,
      do_make_interpolated_string(tl(elements), hd(elements), env)
    )
  end

end
