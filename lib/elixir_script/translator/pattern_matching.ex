defmodule ElixirScript.Translator.PatternMatching do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Struct

  @patterns JS.member_expression(
    JS.member_expression(
    JS.identifier("Elixir"),
    JS.identifier("Core")
    ),
    JS.identifier("Patterns")
  )

  @wildcard JS.member_expression(
    @patterns,
    JS.identifier(:wildcard)
  )

  @parameter JS.member_expression(
    @patterns,
    JS.identifier(:variable)
  )

  @head_tail JS.member_expression(
    @patterns,
    JS.identifier(:headTail)
  )

  @starts_with JS.member_expression(
    @patterns,
    JS.identifier(:startsWith)
  )

  @capture JS.member_expression(
    @patterns,
    JS.identifier(:capture)
  )

  @bound JS.member_expression(
    @patterns,
    JS.identifier(:bound)
  )

  @_type JS.member_expression(
    @patterns,
    JS.identifier(:type)
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

  def type(prototype, value) do
    JS.call_expression(
      @_type,
      [prototype, value]
    )
  end

  def process_match(params, env) do
    build_match(params, env)
    |> update_env(env)
  end

  defp update_env({ patterns, params }, env) do

    { params, env } = Enum.map_reduce(params, env, fn
      (%ESTree.Identifier{name: :undefined} = param, env) ->
        { param, env }

      (%ESTree.Identifier{} = param, env) ->
       env = ElixirScript.Translator.Env.add_var(env, param.name)
       new_name = ElixirScript.Translator.Env.get_var(env, param.name)

       { %{ param | name: new_name }, env }

      (param, env) ->
        { param, env }
    end)

    { patterns, params, env }
  end

  def build_match(params, env) do
    Enum.map(params, &do_build_match(&1, env))
    |> reduce_patterns
  end

  defp do_build_match({:^, _, [value]}, env) do
    { [bound(Translator.translate!(value, env))], [nil] }
  end

  defp do_build_match({:_, _, _}, _) do
    { [wildcard()], [JS.identifier(:undefined)] }
  end

  defp do_build_match([{:|, _, [head, tail]}], env) do
    { [head_tail()], [Translator.translate!(head, env), Translator.translate!(tail, env)] }
  end

  defp do_build_match({:<>, _, [prefix, value]}, env) do
    { [starts_with(prefix)], [Translator.translate!(value, env)] }
  end

  defp do_build_match({:%{}, _, props}, env) do
    properties = Enum.map(props, fn({key, value}) ->
      {pattern, params} = do_build_match(value, env)
      { Map.make_property(Translator.translate!(key, env), hd(List.wrap(pattern))), params }
    end)

    {props, params} = Enum.reduce(properties, {[], []}, fn({prop, param}, {props, params}) ->
      { props ++ [prop], params ++ param }
    end)

    { JS.object_expression(List.wrap(props)), params }
  end

  defp do_build_match({:%, _, [{:__aliases__, _, _} = name, {:%{}, meta, props}]}, env) do
    struct_name = Struct.get_struct_class(name, env)
    {pattern, params} = do_build_match({:%{}, meta, props}, env)

    { [type(struct_name, pattern)], params }
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
    { [Translator.translate!(term, env)], [] }
  end

  defp do_build_match({ one, two }, env) do
    do_build_match({:{}, [], [one, two]}, env)
  end

  defp do_build_match({:{}, _, list}, env) do
    { patterns, params } = list
    |> Enum.map(&build_match([&1], env))
    |> reduce_patterns

    pattern = JS.object_expression([
      JS.property(
        JS.identifier("values"),
        JS.array_expression(patterns)
      )
      ])

    { [type(Primitive.tuple_class, pattern)], params }
  end

  defp do_build_match({:\\, _, [{name, _, _}, default]}, env) do
    name = Utils.filter_name(name)
    { [parameter()], [ JS.assignment_expression(:=, JS.identifier(name), Translator.translate!(default, env))] }
  end


  defp do_build_match({name, _, _}, _) do
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
    { patterns, params } = build_match([source], env)
    { [capture(hd(patterns))], params ++ [JS.identifier(Utils.filter_name(target))] }
  end

end
