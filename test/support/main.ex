defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    Enum.each(1..3, fn x -> JS.console.log(x)  end)
  end
end
