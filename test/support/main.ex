defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")

    JS.console.log String.valid?("a")
    JS.console.log String.valid?(1)
  end
end
