defmodule ElixirScript.Translator.Assignment do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.PatternMatching.Match
  alias ElixirScript.Translator.Primitive

  def make_assignment(left, right, env) do
    { right_ast, env } = Translator.translate(right, env)

    { patterns, params, env } = Match.process_match([left], env)

      declarator = JS.variable_declarator(
        JS.array_pattern(params),
        JS.call_expression(
          JS.member_expression(
            JS.member_expression(
              JS.member_expression(
              JS.identifier("Elixir"),
              JS.identifier("Core")
              ),
              JS.identifier("Patterns")
            ),
            JS.identifier("match")
          ),
          [hd(patterns), right_ast]
        )
      )

    array_pattern = JS.variable_declaration([declarator], :let)

    js_ast = case left do
      list when is_list(list) ->
        make_ref(array_pattern, params, Primitive.list_ast())
      {_left1, _left2} ->
        make_ref(array_pattern, params, Primitive.new_tuple_function())
      {:{}, _, _} ->
        make_ref(array_pattern, params, Primitive.new_tuple_function())
      _ ->
        array_pattern
    end

    { js_ast, env }
  end

  defp make_ref(array_pattern, params, ast) do
    ref = JS.identifier("_ref")

    params = Enum.map(params, fn
      (nil) -> JS.identifier(:undefined)
      (x) -> x
    end)

    ref_declarator = JS.variable_declarator(
      ref,
      JS.call_expression(
        ast,
        params
      )
    )

    ref_declaration = JS.variable_declaration([ref_declarator], :let)
    %ElixirScript.Translator.Group{ body: [array_pattern, ref_declaration] }
  end
end
