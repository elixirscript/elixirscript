defmodule ElixirScript.Translate.Forms.Match do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Helpers
  alias ElixirScript.Translate.Form
  alias ElixirScript.Translate.Forms.Pattern

  def compile({:=, _, [left, right]}, state) do
    build_matches(left, right, %{patterns: []})
    |> compile_match(state)
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

  defp build_matches(pattern, {:=, _, [left, right]}, parts) do
    parts = parts
    |> Map.update!(:patterns, fn(x) -> x ++ [pattern] end)

    build_matches(left, right, parts)
  end

  defp build_matches(left, right, parts) do
    parts
    |> Map.update!(:patterns, fn(x) -> x ++ [left] end)
    |> Map.put(:expression, right)
  end

  defp compile_match(%{patterns: [left], expression: right}, state) do
    { right_ast, state } = Form.compile(right, state)

    {var_decs, right_ast} = case right_ast do
      x when is_list(x) ->
        l = Enum.reverse(x)
        [head | tail] = l
        l = Enum.reverse(tail)

        {l, head}
      x ->
        {[], x}
    end

    { patterns, params, state } = Pattern.compile([left], state)

    array_pattern = Helpers.declare(params, Helpers.call(
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

    { var_decs ++ js_ast, state }
  end

  defp compile_match(%{patterns: lefts, expression: right}, state) do
    { right_ast, state } = Form.compile(right, state)

    {var_dec, right_ast} = case right_ast do
      [variable_declaration, x] ->
        {variable_declaration, x}
      x ->
        {nil, x}
    end

    intermediate_assign = Helpers.assign(
      J.identifier("__intermediate__"),
      right_ast
    )

    {js_ast, state} = Enum.map_reduce(lefts, state, fn(left, state) ->
      { patterns, params, state } = Pattern.compile([left], state)

      array_pattern = Helpers.declare(params, Helpers.call(
        J.member_expression(
          Helpers.patterns(),
          J.identifier("match")
        ),
        [hd(patterns), J.identifier("__intermediate__")]
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
    end)

    js_ast = [intermediate_assign] ++ List.flatten(js_ast)

    {js_ast, state}
  end

end
