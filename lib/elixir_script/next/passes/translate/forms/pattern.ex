defmodule ElixirScript.Translate.Forms.Pattern do
  alias ElixirScript.Translator.PatternMatching, as: PM
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form
  alias ElixirScript.Translate.Forms.{Bitstring}

  @moduledoc """
  Handles all pattern matching translations
  """

  def compile(patterns, state) do
    patterns
    |> do_compile(state)
    |> update_env(state)
  end

  defp do_compile(patterns, state) do
    Enum.reduce(patterns, {[], []}, fn
      x, { patterns, params } ->
        {pattern, param} = process_pattern(x, state)
        { patterns ++ List.wrap(pattern), params ++ List.wrap(param) }
    end) 
  end

  defp update_env({ patterns, params }, state) do
    { params, state } = Enum.map_reduce(params, state, fn
      (%ESTree.Identifier{name: :undefined} = param, state) ->
        { param, state }

      (%ESTree.Identifier{} = param, state) ->
       state = update_variable(param.name, state)
       new_name = get_variable_name(param.name, state)

       { %{ param | name: new_name }, state }

      (param, state) ->
        { param, state }
    end)

    { patterns, params, state }
  end

  def get_variable_name(function, state) do
    number = Map.get(state.vars, function)
    String.to_atom("#{function}#{number}")
  end

  defp update_variable(name, state) do
    vars = Map.update(state.vars, name, 0, fn val -> val + 1 end)
    Map.put(state, :vars, vars)
  end

  defp process_pattern(term, state) when is_number(term) or is_binary(term) or is_boolean(term) or is_atom(term) or is_nil(term) do
    { [Form.compile!(term, state)], [] }
  end

  defp process_pattern({:^, _, [value]}, state) do
    { [PM.bound(Form.compile!(value, state))], [] }
  end

  defp process_pattern({:_, _, _}, _) do
    { [PM.parameter()], [J.identifier(:_)] }
  end

  defp process_pattern({a, b}, state) do
    process_pattern({:{}, [], [a, b] }, state)
  end

  defp process_pattern({:{}, _, elements }, state) do
    { patterns, params } = elements
    |> Enum.map(&do_compile([&1], state))
    |> reduce_patterns(state)

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

  defp process_pattern(list, state) when is_list(list) do
    { patterns, params } = list
    |> Enum.map(&do_compile([&1], state))
    |> reduce_patterns(state)

    {[J.array_expression(patterns)], params}
  end

  defp process_pattern({:|, _, [head, tail]}, state) do
    { head_patterns, head_params } = process_pattern(head, state)
    { tail_patterns, tail_params } = process_pattern(tail, state)
    params = head_params ++ tail_params

    { [PM.head_tail(hd(head_patterns), hd(tail_patterns))], params }  
  end

  defp process_pattern({{:., _, [:erlang, :++]}, context, [head, tail]}, state) do
    process_pattern({:|, context, [head, tail]}, state)
  end

  defp process_pattern({:%, _, [module, {:%{}, _, props}]}, state) do
    process_pattern({:%{}, [], [__module__struct__: module] ++ props}, state)
  end

  defp process_pattern({:%{}, _, props}, state) do
    properties = Enum.map(props, fn
      {:__module__struct__, module} ->
        a = J.object_expression([%ESTree.Property{
            key: J.identifier("__MODULE__"),
            value: J.call_expression(
              J.member_expression(
                J.identifier("Symbol"),
                J.identifier("for")
              ),
              [J.literal(to_string(module))]
            )
          }])

        property = ElixirScript.Translate.Forms.Map.make_property(
          Form.compile!(:__struct__, state),
          a
        )

        { property, [] }

      {key, value} ->
        {pattern, params} = process_pattern(value, state)
        property = case key do
                    {:^, _, [the_key]} ->
                      J.property(Form.compile!(the_key, state), hd(List.wrap(pattern)), :init, false, false, true)
                    _ ->
                      ElixirScript.Translate.Forms.Map.make_property(Form.compile!(key, state), hd(List.wrap(pattern)))
                  end

        { property, params }
    end)

    {props, params} = Enum.reduce(properties, {[], []}, fn({prop, param}, {props, params}) ->
      { props ++ [prop], params ++ param }
    end)

    { [J.object_expression(List.wrap(props))], params }
  end

  defp process_pattern({:<<>>, _, elements}, state) do
    params = Enum.reduce(elements, [], fn
      ({:::, _, [{ variable, _, params }, _]}, state) when is_nil(params)
                                                      when is_list(params) and length(params) == 0 ->
        state ++ [ElixirScript.Translate.Identifier.make_identifier(variable)]
      _, state ->
        state
    end)

    elements = Enum.map(elements, fn
      ({:::, context, [{ _, _, params }, options]}) when is_atom(params) ->
        Bitstring.compile_element({:::, context, [ElixirScript.Translator.PatternMatching, options]}, state)
      x ->
        Bitstring.compile_element(x, state)
    end)

    { [PM.bitstring_match(elements)], params }
  end

  defp process_pattern({:<>, _, [prefix, value]}, state) do
    { [PM.starts_with(prefix)], [Form.compile!(value, state)] }
  end

  defp process_pattern({:=, _, [{name, _, _}, right]}, state) when not name in [:%, :{}, :^, :%{}, :<<>>] do
    unify(name, right, state)
  end

  defp process_pattern({:=, _, [left, {name, _, _}]}, state) when not name in [:%, :{}, :^, :%{}, :<<>>] do
    unify(name, left, state)
  end

  defp process_pattern({var, _, _}, _) do
    { [PM.parameter()], [ElixirScript.Translate.Identifier.make_identifier(var)] }
  end

  defp reduce_patterns(patterns, _) do
    patterns
    |> Enum.reduce({ [], [] }, fn({ pattern, new_param }, { patterns, new_params }) ->
      { patterns ++ List.wrap(pattern), new_params ++ List.wrap(new_param) }
    end)
  end

  defp unify(target, source, state) do
    { patterns, params } = do_compile([source], state)
    { [PM.capture(hd(patterns))], params ++ [ElixirScript.Translate.Identifier.make_identifier(target)] }
  end
end
