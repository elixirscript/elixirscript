defmodule ElixirScript.Tuple do
  @moduledoc false  
  require JS

  def duplicate(data, size) do
    JS.new(Bootstrap.Core.Tuple, do_duplicate(data, size, []))
  end

  defp do_duplicate(_, 0, list) do
    list
  end

  defp do_duplicate(data, size, list) do
    do_duplicate(data, size - 1, list ++ [data])
  end

  def to_list(tuple) do
    tuple["value"]
  end

  def insert_at(tuple, index, value) do
    JS.new(Bootstrap.Core.Tuple, do_insert_at(tuple, index, value, 0, []))
  end

  defp do_insert_at(tuple, index, value, current_index, list) do
    if current_index == length(tuple) do
      list
    else
      list = case index == current_index do
        true ->
          list ++ [value, tuple.get(current_index)]
        false ->
          list ++ [tuple.get(current_index)]
      end

      do_insert_at(tuple, index, value, current_index + 1, list)
    end
  end

  def delete_at(tuple, index) do
    JS.new(Bootstrap.Core.Tuple, do_delete_at(tuple, index, 0, []))
  end

  defp do_delete_at(tuple, index, current_index, list) do
    if current_index == length(tuple) do
      list
    else
      list = case index == current_index do
        true ->
          list
        false ->
          list ++ [tuple.get(current_index)]
      end

      do_delete_at(tuple, index, current_index + 1, list)
    end
  end

  def append(tuple, value) do
    JS.new(Bootstrap.Core.Tuple, to_list(tuple) ++ [value])
  end

end
