defmodule ElixirScript.Translator.Assignment do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.PatternMatching.Match

  def make_assignment(left, right) do
    { patterns, params } = Match.build_match([left])

      declarator = JS.variable_declarator(
        JS.array_pattern(params),
        JS.call_expression(
          JS.member_expression(
            JS.identifier("fun"),
            JS.identifier("bind")
          ),
          [hd(patterns), Translator.translate(right)]
        )
      )

    array_pattern = JS.variable_declaration([declarator], :let)

    case left do
      list when is_list(left) ->
        make_ref(array_pattern, params, "list")
      {_left1, _left2} ->
        make_ref(array_pattern, params, "tuple")
      {:{}, _, elements} ->
        make_ref(array_pattern, params, "tuple")
      _ ->
        array_pattern       
    end
  end

  defp make_ref(array_pattern, params, type) do
    ref = JS.identifier("_ref")

    params = Enum.map(params, fn
      (nil) -> JS.identifier(:undefined)
      (x) -> x
    end)

    ref_declarator = JS.variable_declarator(
      ref,
      JS.call_expression(
        JS.member_expression(
          JS.identifier("Erlang"),
          JS.identifier(type)
        ),
        params
      )         
    )

    ref_declaration = JS.variable_declaration([ref_declarator], :let)
    %ElixirScript.Translator.Group{ body: [array_pattern, ref_declaration] }    
  end

  defp make_function_assignment(function_name, function) do
    declarator = JS.variable_declarator(
      Translator.translate(function_name),
      Translator.translate(function)
    )

    JS.variable_declaration([declarator], :let)   
  end
end