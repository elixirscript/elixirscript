defprotocol ElixirScript.Enumerable do
  @moduledoc false  
  def reduce(enumerable, acc, fun)
  def member?(enumerable, element)
  def count(enumerable)
end

defimpl ElixirScript.Enumerable, for: List do
  def count(list),
    do: {:ok, list.length }

  def member?(list, value),
    do: {:ok, value in list }

  def reduce(list, acc, fun) do
    Bootstrap.Core.Functions.iterator_to_reducer(list, acc, fun)
  end
end

defimpl ElixirScript.Enumerable, for: Map do
  def count(map) do
    {:ok, map.length}
  end

  def member?(map, {key, value}) do
    {:ok, Map.get(map, key) == value }
  end

  def member?(_, _) do
    {:ok, false}
  end

  def reduce(map, acc, fun) do
    map
    |> Map.to_list
    |> Bootstrap.Core.Functions.iterator_to_reducer(acc, fun)
  end
end
