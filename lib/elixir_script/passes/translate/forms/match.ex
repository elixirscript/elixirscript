defmodule ElixirScript.Translate.Forms.Match do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Helpers
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

    array_pattern = Helpers.declare(params, Helpers.call_non_scheduled(
      J.member_expression(
        Helpers.patterns(),
        J.identifier("match")
      ),
      [hd(patterns), right_ast]
    ))

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
    ref_declaration = Helpers.declare(ref, J.array_expression(params))

    [array_pattern, ref_declaration]
  end

  defp make_tuple_ref(array_pattern, params) do
    {ref, params} = make_params(params)

    ref_declaration = Helpers.declare(ref, Helpers.new(
      Helpers.tuple(),
      params
    ))
    [array_pattern, ref_declaration]
  end


  defp make_params(params) do
    ref = J.identifier("_ref#{:rand.uniform(10000000)}")

    params = Enum.map(params, fn
      (nil) -> J.identifier(:undefined)
      (x) -> x
    end)

    { ref, params }
  end

end
