defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    Data.JSON.stringify(1)
  end
end
