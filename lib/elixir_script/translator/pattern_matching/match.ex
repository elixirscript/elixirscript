defmodule ElixirScript.Translator.PatternMatching.Match do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  @wildcard JS.member_expression(
    JS.identifier(:fun),
    JS.identifier(:wildcard)
  )

  @parameter JS.member_expression(
    JS.identifier(:fun),
    JS.identifier(:parameter)
  )

  @head_tail JS.member_expression(
    JS.identifier(:fun),
    JS.identifier(:headTail)
  )

  @starts_with JS.member_expression(
    JS.identifier(:fun),
    JS.identifier(:startsWith)
  )

  @capture JS.member_expression(
    JS.identifier(:fun),
    JS.identifier(:capture)
  )

  @bound JS.member_expression(
    JS.identifier(:fun),
    JS.identifier(:bound)
  )

  def wildcard() do
    @wildcard
  end

  def parameter() do
    @parameter
  end

  def headTail() do
    @head_tail
  end

  def startsWith(prefix) do
    JS.call_expression(
      @starts_with,
      [JS.literal(prefix)]
    )
  end

  def capture(value) do
    JS.call_expression(
      @capture,
      [value]
    )
  end

  def bound(value) do
    JS.call_expression(
      @bound,
      [value]
    )
  end



  def make_list(values) when is_list(values) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier("Erlang"),
        JS.identifier("list")
      ),
      values
    )
  end

  def make_tuple(values) when is_list(values) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier("Erlang"),
        JS.identifier("tuple")
      ),
      values
    )
  end
  
  def build_match(params) do
    Enum.map(params, &do_build_match(&1))
    |> reduce_patterns
  end

  defp do_build_match({:^, _, [value]}) do
    { [bound(Translator.translate(value))], [nil] }
  end

  defp do_build_match({:_, _, _}) do
    { [@wildcard], [JS.identifier(:undefined)] }
  end

  defp do_build_match([{:|, _, [head, tail]}]) do
    { [@head_tail], [Translator.translate(head), Translator.translate(tail)] }
  end

  defp do_build_match({:<>, _, [prefix, value]}) do
    { [startsWith(prefix)], [Translator.translate(value)] }
  end

  defp do_build_match({:%{}, _, props}) do
    properties = Enum.map(props, fn({key, value}) ->
      {pattern, params} = do_build_match(value)
      { JS.property(JS.literal(key), hd(List.wrap(pattern))), params }
    end)

    {props, params} = Enum.reduce(properties, {[], []}, fn({prop, param}, {props, params}) ->
      { props ++ [prop], params ++ param }
    end)

    { JS.object_expression(List.wrap(props)), params }
  end

  defp do_build_match({:%, _, [{:__aliases__, _, name}, {:%{}, meta, props}]}) do
    props = [{"__struct__" ,List.last(name)}] ++ props
    do_build_match({:%{}, meta, props})
  end

  defp do_build_match({:=, _, [{name, _, _}, right]}) when not name in [:%, :{}, :__aliases__, :^] do
    unify(name, right)
  end

  defp do_build_match({:=, _, [left, {name, _, _}]}) when not name in [:%, :{}, :__aliases__, :^] do
    unify(name, left)
  end

  defp do_build_match(list) when is_list(list) do
    { patterns, params } = list
    |> Enum.map(&build_match([&1]))
    |> reduce_patterns

    {[make_list(patterns)], params}
  end

  defp do_build_match(term) when is_number(term) or is_binary(term) or is_boolean(term) or is_atom(term) or is_nil(term) do
    { [Translator.translate(term)], [] }
  end

  defp do_build_match({ one, two }) do
    do_build_match({:{}, [], [one, two]})
  end

  defp do_build_match({:{}, _, list}) do
    { patterns, params } = list
    |> Enum.map(&build_match([&1]))
    |> reduce_patterns

    {[make_tuple(patterns)], params}   
  end

  defp do_build_match({name, _, _}) do
    name = Utils.filter_name(name)
    { [@parameter], [JS.identifier(name)] }
  end

  defp reduce_patterns(patterns) do
    patterns
    |> Enum.reduce({ [], [] }, fn({ pattern, new_param }, { patterns, new_params }) ->
      { patterns ++ List.wrap(pattern), new_params ++ List.wrap(new_param) }
    end)
  end

  defp unify(target, source) do
    {patterns, params} = build_match([source])
    { [capture(hd(patterns))], params ++ [JS.identifier(Utils.filter_name(target))] }
  end

end