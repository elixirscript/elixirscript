defmodule Main do
  def start(:normal, callback) do
    callback.("started")
  end

  def hello do
    "Hello!"
  end
end
