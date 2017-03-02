defmodule ElixirScript.Experimental.Forms.Bitstring do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Experimental.Form


  def compile({:<<>>, _, elements}) do
    js_ast = JS.new_expression(
        JS.member_expression(
          JS.member_expression(
            JS.identifier("Bootstrap"),
            JS.identifier("Core")
          ),
          JS.identifier("BitString")
        ),
        Enum.map(elements, &compile_element(&1))
      )

    js_ast
  end

  def compile_element(element) when is_number(element) do
    do_compile_element({:integer, Form.compile(element)})
  end

  def compile_element(element) when is_binary(element) do
    do_compile_element({:binary, Form.compile(element)})
  end

  def compile_element({:<<>>, [], elements}) do
    {ast, _} = compile(elements)
    ast
  end

  def compile_element({:::, _, [element, {type, _, _}]}) when type in [:integer, :float, :bitstring, :bits, :binary, :bytes, :utf8, :utf16, :utf32, :signed, :unsigned] do
    do_compile_element({type, translate_element(element)})
  end

  def compile_element({:::, _, [element, {type, _, params}]}) when type in [:size, :unit] do
    do_compile_element({type, translate_element(element), Enum.map(params, &translate_element(&1))})
  end

  def compile_element({:::, _, [element, {:*, _, [size, unit]}]}) do
    size_ast = do_compile_element({:size, translate_element(element), [translate_element(size)]})
    do_compile_element({:unit, size_ast, [translate_element(unit)]})
  end

  def compile_element({:::, _, [element, {:-, _, types}]}) do
    handle_type_adjectives({:-, [], types}, translate_element(element))
  end

  def compile_element({:::, _, [element, size]}) do
    do_compile_element({:size, translate_element(element), [translate_element(size)]})
  end

  def compile_element(element) do
    do_compile_element({:binary, translate_element(element)})
  end

  def translate_element(ElixirScript.Translator.PatternMatching, _) do
    JS.object_expression([JS.property(
                                      JS.literal("value"),
                                      ElixirScript.Translator.PatternMatching.parameter()
                           )
                         ])
  end

  def translate_element(element) do
    Form.compile(element)
  end

  defp handle_type_adjectives({:-, _, types}, ast) do
    Enum.reduce(types, ast, fn(type, current_ast) ->
      case type do
        {:-, _, sub_types} ->
          handle_type_adjectives({:-, [], sub_types}, current_ast)
        {:*, _, [size, unit]} ->
          size_ast = do_compile_element({:size, current_ast, [Form.compile(size)]})
          do_compile_element({:unit, size_ast, [Form.compile(unit)]})
        {the_type, _, params} when is_list(params) ->
          do_compile_element({the_type, current_ast, Enum.map(params, &Form.compile(&1))})
        {the_type, _, _} ->
          do_compile_element({the_type, current_ast})
      end
    end)
  end

  defp bitstring_class() do
    JS.member_expression(
      JS.member_expression(
        JS.identifier("Bootstrap"),
        JS.identifier("Core")
      ),
      JS.identifier("BitString")
    )
  end

  defp do_compile_element({type, ast}) do
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

  defp do_compile_element({type, ast, params}) when is_list(params) do
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

  def make_interpolated_string(elements) do
    translated_elements = Enum.map(elements, fn(x)->
      case x do
        elem when is_binary(elem) ->
          Form.compile(elem)
        {:::, _, data} ->
          Form.compile(hd(data))
      end
    end)

    { do_make_interpolated_string(tl(translated_elements), hd(translated_elements)) }
  end

  defp do_make_interpolated_string([], ast, _) do
    ast
  end

  defp do_make_interpolated_string(elements, ast) do
    JS.binary_expression(
      :+,
      ast,
      do_make_interpolated_string(tl(elements), hd(elements))
    )
  end

end
