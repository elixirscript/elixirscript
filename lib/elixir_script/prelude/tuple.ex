defmodule ElixirScript.Tuple do

  def duplicate(data, size) do
    Elixir.Core.Functions.make_tuple(size, data)
  end

  def to_list(tuple) do
    tuple["value"]
  end

  def insert_at(tuple, index, value) do
    Elixir.Core.Functions.insert_at(tuple, index, value)
  end

  def delete_at(tuple, index) do
    Elixir.Core.Functions.delete_at(tuple, index)
  end

  def append(tuple, value) do
    Elixir.Core.Functions.new_tuple.apply(nil, to_list(tuple) ++ value)
  end

end
