defprotocol ElixirScript.Enumerable do
  def reduce(collection, acc, fun)
  def member?(collection, value)
  def count(collection)
end


defimpl ElixirScript.Enumerable, for: List do
  def reduce(_,     {:halt, acc}, _fun),   do: {:halted, acc}
  def reduce(list,  {:suspend, acc}, fun), do: {:suspended, acc, &reduce(list, &1, fun)}
  def reduce([],    {:cont, acc}, _fun),   do: {:done, acc}
  def reduce([h|t], {:cont, acc}, fun),    do: reduce(t, fun.(h, acc), fun)

  def member?(_list, _value),
    do: {:error, __MODULE__}
  def count(_list),
    do: {:error, __MODULE__}
end


defimpl ElixirScript.Enumerable, for: Map do
  def reduce(map, acc, fun) do
    do_reduce(Elixir.Core.map_to_list(map), acc, fun)
  end

  defp do_reduce(_,     {:halt, acc}, _fun),   do: {:halted, acc}
  defp do_reduce(list,  {:suspend, acc}, fun), do: {:suspended, acc, &do_reduce(list, &1, fun)}
  defp do_reduce([],    {:cont, acc}, _fun),   do: {:done, acc}
  defp do_reduce([h|t], {:cont, acc}, fun),    do: do_reduce(t, fun.(h, acc), fun)

  def member?(map, {key, value}) do
    {:ok, match?({:ok, ^value}, map[key]) }
  end

  def member?(_map, _other) do
    { :ok, false }
  end

  def count(map) do
    { :ok, map_size(map) }
  end
end


defimpl ElixirScript.Enumerable, for: Function do
  def reduce(function, acc, fun) when is_function(function, 2),
    do: function.(acc, fun)
  def member?(_function, _value),
    do: {:error, __MODULE__}
  def count(_function),
    do: {:error, __MODULE__}
end
