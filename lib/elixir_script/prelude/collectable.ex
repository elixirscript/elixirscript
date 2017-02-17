defprotocol ElixirScript.Collectable do
  @moduledoc false  
  def into(collectable)
end

defimpl Collectable, for: List do
  def into(original) do
    {[], fn
      list, {:cont, x} -> list ++ [x]
      list, :done -> original ++ list
      _, :halt -> :ok
    end}
  end
end

defimpl Collectable, for: BitString do
  def into(original) do
    {original, fn
      acc, {:cont, x} when is_bitstring(x) -> <<acc::bitstring, x::bitstring>>
      acc, :done -> acc
      _, :halt -> :ok
    end}
  end
end

defimpl Collectable, for: Map do
  def into(original) do
    {original, fn
      map, {:cont, {k, v}} -> Map.put(map, k, v)
      map, :done -> map
      _, :halt -> :ok
    end}
  end
end