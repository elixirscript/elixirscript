defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")
    Enum.each(%{a: 1}, fn(x) -> JS.console.log(x) end)
  end
end
