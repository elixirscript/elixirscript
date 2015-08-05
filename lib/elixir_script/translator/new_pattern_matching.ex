defmodule ElixirScript.Translator.NewPatternMatching do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  @parameter JS.member_expression(
    JS.identifier(:funcy),
    JS.identifier(:parameter)
  )

  @head_tail JS.member_expression(
    JS.identifier(:funcy),
    JS.identifier(:headTail)
  )

  @starts_with JS.member_expression(
    JS.identifier(:funcy),
    JS.identifier(:startsWith)
  )

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
  
  def build_match(params) do
    Enum.map(params, &do_build_match(&1))
    |> reduce_patterns
  end

  defp do_build_match([{:|, _, [head, tail]}]) do
    { [@head_tail], [Translator.translate(head), Translator.translate(tail)] }
  end

  defp do_build_match({:<>, _, [prefix, value]}) do
    { [startsWith(prefix)], [Translator.translate(value)] }
  end

  defp do_build_match({:%, _, [{:__aliases__, _, name}, {:%{}, _, props}]}) do
    properties = Enum.map(props, fn({key, value}) ->
      {pattern, params} = do_build_match(value)
      { JS.property(Translator.translate(key), hd(pattern)), params }
    end)

    struct_prop = JS.property(JS.literal("__struct__"), Translator.translate(name))

    properties = [{ struct_prop, [] }] ++ properties

    {props, params} = Enum.reduce(properties, {[], []}, fn({prop, param}, {props, params}) ->
      { props ++ [prop], params ++ param }
    end)

    { JS.object_expression(List.wrap(props)), params }
  end

  defp do_build_match(list) when is_list(list) do
    list
    |> Enum.map(&build_match([&1]))
    |> reduce_patterns
  end

  defp do_build_match(term) when is_number(term) or is_binary(term) or is_boolean(term) or is_atom(term) or is_nil(term) do
    { [Translator.translate(term)], [] }
  end

  defp do_build_match({name, _, _}) do
    { [@parameter], [JS.identifier(name)] }
  end

  defp reduce_patterns(patterns) do
    patterns
    |> Enum.reduce({ [], [] }, fn({ pattern, new_param }, { patterns, new_params }) ->
      { patterns ++ List.wrap(pattern), new_params ++ List.wrap(new_param) }
    end)
  end

end