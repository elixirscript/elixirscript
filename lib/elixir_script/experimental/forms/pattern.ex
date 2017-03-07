defmodule ElixirScript.Experimental.Forms.Pattern do
  alias ElixirScript.Translator.PatternMatching, as: PM
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Experimental.Forms.{Bitstring, Map}

  def compile(patterns) do
    patterns
    |> Enum.reduce({[], []}, fn
      x, { patterns, params } ->
        {pattern, param} = process_pattern(x)
        { patterns ++ List.wrap(pattern), params ++ List.wrap(param) }
    end)
  end

  defp process_pattern(term) when is_number(term) or is_binary(term) or is_boolean(term) or is_atom(term) or is_nil(term) do
    { [Form.compile(term)], [] }
  end

  defp process_pattern({:^, _, [value]}) do
    { [PM.bound(Form.compile(value))], [nil] }
  end

  defp process_pattern({:_, _, _}) do
    { [PM.wildcard()], [J.identifier(:_)] }
  end

  defp process_pattern({a, b}) do
    process_pattern({:{}, [], [a, b] })
  end

  defp process_pattern({:{}, _, elements }) do
    { patterns, params } = elements
    |> Enum.map(&compile([&1]))
    |> reduce_patterns

    pattern = J.object_expression([
      J.property(
        J.identifier("values"),
        J.array_expression(patterns)
      )
      ])

    tuple = J.member_expression(
        J.member_expression(
          J.identifier("Bootstrap"),
          J.identifier("Core")
        ),
        J.identifier("Tuple")
      )

    { [PM.type(tuple, pattern)], params }
  end

  defp process_pattern(list) when is_list(list) do
    { patterns, params } = list
    |> Enum.map(&compile([&1]))
    |> reduce_patterns

    {[J.array_expression(patterns)], params}
  end

  defp process_pattern({:%{}, _, props}) do
    properties = Enum.map(props, fn({key, value}) ->
      {pattern, params} = process_pattern(value)
      property = case key do
                   {:^, _, [the_key]} ->
                     J.property(Form.compile(the_key), hd(List.wrap(pattern)), :init, false, false, true)
                   _ ->
                     Map.make_property(Form.compile(key), hd(List.wrap(pattern)))
                 end

      { property, params }
    end)

    {props, params} = Enum.reduce(properties, {[], []}, fn({prop, param}, {props, params}) ->
      { props ++ [prop], params ++ param }
    end)

    { J.object_expression(List.wrap(props)), params }
  end

  defp process_pattern({:<<>>, _, elements}) do
    params = Enum.reduce(elements, [], fn
      ({:::, _, [{ variable, _, params }, _]}, state) when is_nil(params)
                                                      when is_list(params) and length(params) == 0 ->
        state ++ [J.identifier(variable)]
      _, state ->
        state
    end)

    elements = Enum.map(elements, fn
      ({:::, context, [{ _, _, params }, options]}) when is_atom(params) ->
        Bitstring.compile_element({:::, context, [ElixirScript.Translator.PatternMatching, options]})
      x ->
        Bitstring.compile_element(x)
    end)

    { [PM.bitstring_match(elements)], params }
  end

  defp process_pattern([{:|, _, [head, tail]}]) do
    { head_patterns, head_params } = process_pattern(head)
    { tail_patterns, tail_params } = process_pattern(tail)
    params = head_params ++ tail_params

    { [PM.head_tail(hd(head_patterns), hd(tail_patterns))], params }
  end

  defp process_pattern({:<>, _, [prefix, value]}) do
    { [PM.starts_with(prefix)], [Form.compile(value)] }
  end

  defp process_pattern({:%{}, _, [__struct__: name]}) do
  end

  defp process_pattern({:=, _, [{name, _, _}, right]}) do
    unify(name, right)
  end

  defp process_pattern({:=, _, [left, {name, _, _}]}) do
    unify(name, left)
  end

  defp process_pattern({var, _, _}) do
    { [PM.parameter()], [J.identifier(var)] }
  end

  defp reduce_patterns(patterns) do
    patterns
    |> Enum.reduce({ [], [] }, fn({ pattern, new_param }, { patterns, new_params }) ->
      { patterns ++ List.wrap(pattern), new_params ++ List.wrap(new_param) }
    end)
  end

  defp unify(target, source) do
    { patterns, params } = compile([source])
    { [PM.capture(hd(patterns))], params ++ [J.identifier(target)] }
  end

end
