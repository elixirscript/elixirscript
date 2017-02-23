defprotocol ElixirScript.Enumerable do
  @moduledoc false  
  def reduce(enumerable, acc, fun)
  def member?(enumerable, element)
  def count(enumerable)
end

defimpl ElixirScript.Enumerable, for: List do
  def count(list),
    do: length(list)

  def member?(list, value),
    do: value in list

  def reduce(_,       {:halt, acc}, _fun),   do: {:halted, acc}
  def reduce(list,    {:suspend, acc}, fun), do: {:suspended, acc, &reduce(list, &1, fun)}
  def reduce([],      {:cont, acc}, _fun),   do: {:done, acc}
  def reduce([h | t], {:cont, acc}, fun),    do: reduce(t, fun.(h, acc), fun)
end

defimpl ElixirScript.Enumerable, for: Map do
  def count(map) do
    {:ok, map_size(map)}
  end

  def member?(map, {key, value}) do
    {:ok, match?(^value, Map.get(map, key))}
  end

  def member?(_, _) do
    {:ok, false}
  end

  def reduce(map, acc, fun) do
    do_reduce(Map.to_list(map), acc, fun)
  end

  defp do_reduce(_,       {:halt, acc}, _fun),   do: {:halted, acc}
  defp do_reduce(list,    {:suspend, acc}, fun), do: {:suspended, acc, &do_reduce(list, &1, fun)}
  defp do_reduce([],      {:cont, acc}, _fun),   do: {:done, acc}
  defp do_reduce([h | t], {:cont, acc}, fun),    do: do_reduce(t, fun.(h, acc), fun)
end
