defmodule ElixirScript.PatternMatching.Match do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Map

  @wildcard JS.member_expression(
    JS.identifier(:Patterns),
    JS.identifier(:wildcard)
  )

  @parameter JS.member_expression(
    JS.identifier(:Patterns),
    JS.identifier(:variable)
  )

  @head_tail JS.member_expression(
    JS.identifier(:Patterns),
    JS.identifier(:headTail)
  )

  @starts_with JS.member_expression(
    JS.identifier(:Patterns),
    JS.identifier(:startsWith)
  )

  @capture JS.member_expression(
    JS.identifier(:Patterns),
    JS.identifier(:capture)
  )

  @bound JS.member_expression(
    JS.identifier(:Patterns),
    JS.identifier(:bound)
  )

  def wildcard() do
    JS.call_expression(
      @wildcard,
      []
    )
  end

  def parameter() do
    JS.call_expression(
      @parameter,
      []
    )
  end

  def head_tail() do
    JS.call_expression(
      @head_tail,
      []
    )
  end

  def starts_with(prefix) do
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
  
  def build_match(params, env) do
    Enum.map(params, &do_build_match(&1, env))
    |> reduce_patterns
  end

  defp do_build_match({:^, _, [value]}, env) do
    { [bound(Translator.translate(value, env))], [nil] }
  end

  defp do_build_match({:_, _, _}, env) do
    { [wildcard()], [JS.identifier(:undefined)] }
  end

  defp do_build_match([{:|, _, [head, tail]}], env) do
    { [head_tail()], [Translator.translate(head, env), Translator.translate(tail, env)] }
  end

  defp do_build_match({:<>, _, [prefix, value]}, env) do
    { [starts_with(prefix)], [Translator.translate(value, env)] }
  end

  defp do_build_match({:%{}, _, props}, env) do
    properties = Enum.map(props, fn({key, value}) ->
      {pattern, params} = do_build_match(value, env)
      { Map.make_property(JS.literal(key), hd(List.wrap(pattern))), params }
    end)

    {props, params} = Enum.reduce(properties, {[], []}, fn({prop, param}, {props, params}) ->
      { props ++ [prop], params ++ param }
    end)

    { JS.object_expression(List.wrap(props)), params }
  end

  defp do_build_match({:%, _, [{:__aliases__, _, name}, {:%{}, meta, props}]}, env) do
    props = [{"__struct__" ,List.last(name)}] ++ props
    do_build_match({:%{}, meta, props}, env)
  end

  defp do_build_match({:=, _, [{name, _, _}, right]}, env) when not name in [:%, :{}, :__aliases__, :^, :%{}] do
    unify(name, right, env)
  end

  defp do_build_match({:=, _, [left, {name, _, _}]}, env) when not name in [:%, :{}, :__aliases__, :^, :%{}] do
    unify(name, left, env)
  end

  defp do_build_match(list, env) when is_list(list) do
    { patterns, params } = list
    |> Enum.map(&build_match([&1], env))
    |> reduce_patterns

    {[Primitive.make_list_no_translate(patterns)], params}
  end

  defp do_build_match(term, env) when is_number(term) or is_binary(term) or is_boolean(term) or is_atom(term) or is_nil(term) do
    { [Translator.translate(term, env)], [] }
  end

  defp do_build_match({ one, two }, env) do
    do_build_match({:{}, [], [one, two]}, env)
  end

  defp do_build_match({:{}, _, list}, env) do
    { patterns, params } = list
    |> Enum.map(&build_match([&1], env))
    |> reduce_patterns

    {[Primitive.make_tuple_no_translate(patterns)], params}   
  end

  defp do_build_match({name, _, _}, env) do
    name = Utils.filter_name(name)
    { [parameter()], [JS.identifier(name)] }
  end

  defp reduce_patterns(patterns) do
    patterns
    |> Enum.reduce({ [], [] }, fn({ pattern, new_param }, { patterns, new_params }) ->
      { patterns ++ List.wrap(pattern), new_params ++ List.wrap(new_param) }
    end)
  end

  defp unify(target, source, env) do
    {patterns, params} = build_match([source], env)
    { [capture(hd(patterns))], params ++ [JS.identifier(Utils.filter_name(target))] }
  end

end