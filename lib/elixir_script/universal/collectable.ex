defprotocol ElixirScript.Collectable do
  def into(collectable)
end

defimpl ElixirScript.Collectable, for: List do
  def into(original) do
    {[], fn
      list, {:cont, x} -> [ x | list ]
      list, :done -> original ++ Elixir.Core.reverse(list)
      _, :halt -> :ok
    end}
  end
end
