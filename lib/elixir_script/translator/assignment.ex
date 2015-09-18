defmodule ElixirScript.Translator.Assignment do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.PatternMatching.Match

  def make_assignment(left, right, env) do
    { patterns, params } = Match.build_match([left], env)

      declarator = JS.variable_declarator(
        JS.array_pattern(params),
        JS.call_expression(
          JS.member_expression(
            JS.identifier("Patterns"),
            JS.identifier("match")
          ),
          [hd(patterns), Translator.translate(right, env)]
        )
      )

    array_pattern = JS.variable_declaration([declarator], :let)

    case left do
      list when is_list(list) ->
        make_ref(array_pattern, params, "list")
      {_left1, _left2} ->
        make_ref(array_pattern, params, "tuple")
      {:{}, _, _} ->
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
end