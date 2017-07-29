defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    String.upcase("d")
  end
end
