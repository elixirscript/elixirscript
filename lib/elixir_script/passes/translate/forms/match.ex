defmodule ElixirScript.Translate.Forms.Match do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form
  alias ElixirScript.Translate.Forms.Pattern

  def compile({:=, _, [left, right]}, state) do
    { right_ast, state } = Form.compile(right, state)

    {var_dec, right_ast} = case right_ast do
      [variable_declaration, x] ->
        {variable_declaration, x}
      x ->
        {nil, x}
    end

    { patterns, params, state } = Pattern.compile([left], state)

      declarator = J.variable_declarator(
        J.array_pattern(params),
        J.call_expression(
          J.member_expression(
            J.member_expression(
              J.member_expression(
              J.identifier("Bootstrap"),
              J.identifier("Core")
              ),
              J.identifier("Patterns")
            ),
            J.identifier("match")
          ),
          [hd(patterns), right_ast]
        )
      )

    array_pattern = J.variable_declaration([declarator], :let)

    js_ast = case left do
      list when is_list(list) ->
        make_list_ref(array_pattern, params)
      { _, _ } ->
        make_tuple_ref(array_pattern, params)
      {:{}, _, _ } ->
        make_tuple_ref(array_pattern, params)
      _ ->
        List.wrap(array_pattern)
    end

    js_ast = case var_dec do
      nil ->
        js_ast
      x ->
        [x] ++ js_ast
    end

    { js_ast, state }
  end


  defp make_list_ref(array_pattern, params) do
    {ref, params} = make_params(params)

    ref_declarator = J.variable_declarator(ref, J.array_expression(params))
    make_variable_declaration_and_group(ref_declarator, array_pattern)
  end

  defp make_tuple_ref(array_pattern, params) do
    {ref, params} = make_params(params)

    ref_declarator = J.variable_declarator(
      ref,
      J.new_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.member_expression(
            J.identifier("Core"),
            J.identifier("Tuple")
          )
        ),
        params
      )
    )

    make_variable_declaration_and_group(ref_declarator, array_pattern)
  end


  defp make_params(params) do
    ref = J.identifier("_ref")

    params = Enum.map(params, fn
      (nil) -> J.identifier(:undefined)
      (x) -> x
    end)

    { ref, params }
  end

  defp make_variable_declaration_and_group(ref_declarator, array_pattern) do
    ref_declaration = J.variable_declaration([ref_declarator], :let)
    [array_pattern, ref_declaration]
  end

end