defmodule ElixirScript.Tuple do

  def duplicate(data, size) do
    Elixir.Core.make_tuple(size, data)
  end

  def to_list(tuple) do
    tuple["value"]
  end

  def insert_at(tuple, index, value) do
    Elixir.Core.insert_at(tuple, index, value)
  end

  def delete_at(tuple, index) do
    Elixir.Core.delete_at(tuple, index)
  end

  def append(tuple, value) do
    Elixir.Core.new_tuple(to_list(tuple) ++ value)
  end

end
