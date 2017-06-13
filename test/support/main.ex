defmodule Main do
  def start(:normal, [callback]) do
    callback.("started")
    user = %User{}
    user.first
    draw()
  end

  defp draw() do
    JS.console.log("Here")
  end
end
