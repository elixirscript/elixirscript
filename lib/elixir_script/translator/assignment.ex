defmodule ElixirScript.Translator.Assignment do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Primitive

  def make_assignment(left, right, env) do
    { right_ast, env } = Translator.translate(right, env)

    { patterns, params, env } = PatternMatching.process_match([left], env)

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
        make_list_ref(array_pattern, params)
      { _, _ } ->
        make_tuple_ref(array_pattern, params)
      {:{}, _, _ } ->
        make_tuple_ref(array_pattern, params)
      _ ->
        array_pattern
    end

    { js_ast, env }
  end

  defp make_list_ref(array_pattern, params) do
    {ref, params} = make_params(params)

    ref_declarator = JS.variable_declarator(
      ref,
      JS.call_expression(
        Primitive.list_ast(),
        params
      )
    )

    make_variable_declaration_and_group(ref_declarator, array_pattern)
  end

  defp make_tuple_ref(array_pattern, params) do
    {ref, params} = make_params(params)

    ref_declarator = JS.variable_declarator(
      ref,
      JS.new_expression(
        JS.member_expression(
          JS.identifier("Elixir"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Tuple")
          )
        ),
        params
      )
    )

    make_variable_declaration_and_group(ref_declarator, array_pattern)
  end


  defp make_params(params) do
    ref = JS.identifier("_ref")

    params = Enum.map(params, fn
      (nil) -> JS.identifier(:undefined)
      (x) -> x
    end)

    { ref, params }
  end

  defp make_variable_declaration_and_group(ref_declarator, array_pattern) do
    ref_declaration = JS.variable_declaration([ref_declarator], :let)
    %ElixirScript.Translator.Group{ body: [array_pattern, ref_declaration] }
  end
end
