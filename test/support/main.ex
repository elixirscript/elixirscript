defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")
    Agent.start(fn() -> nil end)
    Data.JSON.stringify(%{})
  end
end
