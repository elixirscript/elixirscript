defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")
    Enum.each(1..5, fn(x) -> JS.console.log(x) end)
  end
end
