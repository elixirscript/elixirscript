defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")
  end
end
