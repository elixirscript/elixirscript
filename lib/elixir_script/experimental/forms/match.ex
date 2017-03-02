defmodule ElixirScript.Experimental.Forms.Match do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Experimental.Forms.{Pattern}

  def compile({:=, _, [left, right]}) do
    right_ast = Form.compile(right)

    { patterns, params } = Pattern.compile([left])

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
        array_pattern
    end

    js_ast
  end


  defp make_list_ref(array_pattern, params) do
    {ref, params} = make_params(params)

    ref_declarator = J.variable_declarator(
      ref,
      J.array_expression(
        Enum.map(params, &Form.compile(&1))
      )
    )

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