defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    IO.inspect 1
  end
end
