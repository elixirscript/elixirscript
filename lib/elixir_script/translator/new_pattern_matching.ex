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

  def parameter() do
    @parameter
  end

  def headTail() do
    @head_tail
  end
  
  def build_match(params) do
    Enum.map(params, &do_build_match(&1))
    |> Enum.reduce({ [], [] }, fn({ pattern, new_param }, { patterns, new_params }) ->
      { patterns ++ List.wrap(pattern), new_params ++ List.wrap(new_param) }
    end)
  end

  defp do_build_match({name, _, _}) do
    { [@parameter], [JS.identifier(name)] }
  end

  defp do_build_match([{:|, [], [head, tail]}]) do
    { [@head_tail], [Translator.translate(head), Translator.translate(tail)] }
  end

end