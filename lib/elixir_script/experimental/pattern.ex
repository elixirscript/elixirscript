defmodule ElixirScript.Experimental.Pattern do
  alias ElixirScript.Translator.PatternMatching, as: PM
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form 

  def compile(patterns) do
    patterns
    |> Enum.reduce({[], []}, fn 
      x, { patterns, params } ->
        {pattern, param} = process_pattern(x)
        { patterns ++ List.wrap(pattern), params ++ List.wrap(param) }      
    end)
  end

  defp process_pattern({:^, _, [value]}, env) do
    { [bound(Form.compile(value))], [nil] }
  end

  defp process_pattern({:_, _, nil}) do
    { [PM.wildcard()], [J.identifier("undefined")] }
  end

  defp process_pattern({var, _, nil}) do
    { [PM.parameter()], [J.identifier(var)] }
  end

  defp process_pattern({a, b}) do
    process_pattern({:{}, [], [a, b] })
  end

  defp process_pattern({:{}, _, elements }) do
  end

  defp process_pattern(list) when is_list(list) do
  end

  defp process_pattern({:%{}, _, kv}) do
  end

  defp process_pattern({:=, _, [left, right]}) do
  end

  defp process_pattern({:<<>>, _, elements}) do
  end

  defp process_pattern([{:|, _, [head, tail]}]) do
  end

  defp process_pattern({:<>, _, [prefix, value]}) do
  end

  defp process_pattern({:%{}, _, [__struct__: name]}) do
  end

end
