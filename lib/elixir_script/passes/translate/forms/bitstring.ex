defmodule ElixirScript.Translate.Forms.Bitstring do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translate.Form


  def compile({:<<>>, _, elements}, state) do
    js_ast = JS.new_expression(
        JS.member_expression(
          JS.member_expression(
            JS.identifier("Bootstrap"),
            JS.identifier("Core")
          ),
          JS.identifier("BitString")
        ),
        Enum.map(elements, &compile_element(&1, state))
      )

    { js_ast, state }
  end

  def compile_element(element, state) when is_number(element) do
    do_compile_element({:integer, Form.compile!(element, state)})
  end

  def compile_element(element, state) when is_binary(element) do
    do_compile_element({:binary, Form.compile!(element, state)})
  end

  def compile_element({:<<>>, [], elements}, state) do
    {ast, _} = compile(elements, state)
    ast
  end

  def compile_element({:::, _, [element, {type, _, _}]}, state) when type in [:integer, :float, :bitstring, :bits, :binary, :bytes, :utf8, :utf16, :utf32, :signed, :unsigned] do
    do_compile_element({type, translate_element(element, state)})
  end

  def compile_element({:::, _, [element, {type, _, params}]}, state) when type in [:size, :unit] do
    do_compile_element({type, translate_element(element, state), Enum.map(params, &translate_element(&1, state))})
  end

  def compile_element({:::, _, [element, {:*, _, [size, unit]}]}, state) do
    size_ast = do_compile_element({:size, translate_element(element, state), [translate_element(size, state)]})
    do_compile_element({:unit, size_ast, [translate_element(unit, state)]})
  end

  def compile_element({:::, _, [element, {:-, _, types}]}, state) do
    handle_type_adjectives({:-, [], types}, translate_element(element, state), state)
  end

  def compile_element({:::, _, [element, size]}, state) do
    do_compile_element({:size, translate_element(element, state), [translate_element(size, state)]})
  end

  def compile_element(element, state) do
    do_compile_element({:binary, translate_element(element, state)})
  end

  def translate_element(ElixirScript.Translate.Forms.Pattern.Patterns, _) do
    JS.object_expression([JS.property(
                                      JS.literal("value"),
                                      ElixirScript.Translate.Forms.Pattern.Patterns.parameter()
                           )
                         ])
  end

  def translate_element(element, state) do
    Form.compile!(element, state)
  end

  defp handle_type_adjectives({:-, _, types}, ast, state) do
    Enum.reduce(types, ast, fn(type, current_ast) ->
      case type do
        {:-, _, sub_types} ->
          handle_type_adjectives({:-, [], sub_types}, current_ast, state)
        {:*, _, [size, unit]} ->
          size_ast = do_compile_element({:size, current_ast, [Form.compile!(size, state)]})
          do_compile_element({:unit, size_ast, [Form.compile!(unit, state)]})
        {the_type, _, params} when is_list(params) ->
          do_compile_element({the_type, current_ast, Enum.map(params, &Form.compile!(&1, state))})
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
        bitstring_class(),
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
        bitstring_class(),
        JS.identifier(type)
      ),
      [
        ast
      ] ++ params
    )
  end

  def make_interpolated_string(elements, state) do
    translated_elements = Enum.map(elements, fn(x) ->
      case x do
        elem when is_binary(elem) ->
          Form.compile!(elem, state)
        {:::, _, data} ->
          Form.compile!(hd(data), state)
      end
    end)

    result = case translated_elements do
      [] ->
        JS.literal('')
      [element] ->
        do_make_interpolated_string([], hd(translated_elements))
      elements ->
        do_make_interpolated_string(tl(elements), hd(elements))
    end

    {result, state}
  end

  defp do_make_interpolated_string([], ast) do
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
