defmodule Main do
  def start(:normal, callback) do
    elem({1, 2}, 0)
    Enum.map([], fn(x) -> x end)
    callback.("started")
  end

  def hello do
    "Hello!"
  end
end
