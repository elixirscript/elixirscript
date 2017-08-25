defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    Enum.map(1..5, fn(x) -> x * 2 end)
  end
end
