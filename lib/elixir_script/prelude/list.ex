defmodule ElixirScript.List do

  def duplicate(data, size) do
    do_duplicate(data, size, [])
  end

  defp do_duplicate(_, 0, list) do
    list
  end

  defp do_duplicate(data, size, list) do
    do_duplicate(data, size - 1, list ++ [data])
  end

  def to_tuple(list) do
    JS.new(Elixir.Core.Tuple, list)
  end

  def wrap(list) when is_list(list), do: list
  def wrap(nil), do: []
  def wrap(term), do: [term]

  def append(list, term) do
    concat(list, [term])
  end

  def prepend(list, term) do
    concat([term], list)
  end

  def concat(list_a, list_b) do
    list_a.concat(list_b)
  end

  def first(list) do
    list[0]
  end

  def last(list) do
    list[length(list) - 1]
  end

  def delete(list, item) do
    do_delete(list, item, 0, [])
  end

  defp do_delete(list, item, current_index, new_list) do
    if current_index == length(list) do
      new_list
    else
      new_list = case list[current_index] do
        ^item ->
          new_list
        _ ->
          new_list ++ [list[current_index]]
      end

      do_delete(list, item, current_index + 1, new_list)
    end
  end

  def delete_at(list, index) do
    do_delete_at(list, index, 0, [])
  end

  defp do_delete_at(list, index, current_index, new_list) do
    if current_index == length(list) do
      new_list
    else
      new_list = case current_index == index do
        true ->
          new_list
        _ ->
          new_list ++ [list[current_index]]
      end

      do_delete_at(list, index, current_index + 1, new_list)
    end
  end

  def insert_at(list, index, value) do
    do_insert_at(list, index, value, 0, [])
  end

  defp do_insert_at(list, index, value, current_index, new_list) do
    if current_index == length(list) do
      new_list
    else
      new_list = case current_index == index do
        true ->
          new_list ++ [value, list[current_index]]
        _ ->
          new_list ++ [list[current_index]]
      end

      do_insert_at(list, index, value, current_index + 1, new_list)
    end
  end

  def replace_at(list, index, value) do
    do_replace_at(list, index, value, 0, [])
  end

  defp do_replace_at(list, index, value, current_index, new_list) do
    if current_index == length(list) do
      new_list
    else
      new_list = case current_index == index do
        true ->
          new_list ++ [value]
        _ ->
          new_list ++ [list[current_index]]
      end

      do_replace_at(list, index, value, current_index + 1, new_list)
    end
  end


  def update_at(list, index, func) do
    do_update_at(list, index, func, 0, [])
  end

  defp do_update_at(list, index, func, current_index, new_list) do
    if current_index == length(list) do
      new_list
    else
      new_list = case current_index == index do
        true ->
          new_list ++ [func.(list[current_index])]
        _ ->
          new_list ++ [list[current_index]]
      end

      do_update_at(list, index, func, current_index + 1, new_list)
    end
  end


  def foldl(list, acc, func) do
    do_foldl(list, acc, func, [])
  end

  def foldr(list, acc, func) do
    do_foldl(list.concat([]).reverse(), acc, func, [])
  end

  defp do_foldl([], acc, _, new_list) do
    { acc, new_list }
  end

  defp do_foldl(list, acc, func, new_list) do
    { acc, value } = func.(hd(list), acc)
    do_foldl(tl(list), acc, func, new_list ++ [value])
  end

  def flatten(list) do
    do_flatten(list, [])
  end

  def flatten(list, tail) do
    do_flatten(list, []) ++ tail
  end

  defp do_flatten([], flattened_list) do
    flattened_list
  end

  defp do_flatten(list, flattened_list) do
    flattened_list = case hd(list) do
      l when is_list(l) ->
        flattened_list ++ do_flatten(l, [])
      item ->
        flattened_list ++ [item]
    end

    do_flatten(tl(list), flattened_list)
  end


  def keydelete(list, key, position) do
    do_keydelete(list, key, position, [])
  end

  defp do_keydelete([], _, _, new_list) do
    new_list
  end

  defp do_keydelete(list, key, position, new_list) do
    current_value = hd(list)

    new_list = if elem(current_value, position) == key do
      new_list
    else
      new_list ++ [current_value]
    end

    do_keydelete(tl(list), key, position, new_list)
  end

  def keyfind(list, key, position) do
    do_keyfind(list, key, position, nil)
  end

  def keyfind(list, key, position, default) do
    do_keyfind(list, key, position, default)
  end

  defp do_keyfind([], _, _, default) do
    default
  end

  defp do_keyfind(list, key, position, default) do
    current_value = hd(list)

    if elem(current_value, position) == key do
      current_value
    else
      do_keyfind(tl(list), key, position, default)
    end
  end

  def keymember?(list, key, position) do
    keyfind(list, key, position) != nil
  end

  def keyreplace(list, key, position, new_tuple) do
    do_keyreplace(list, key, position, [], new_tuple)
  end

  defp do_keyreplace([], _, _, new_list, _) do
    new_list
  end

  defp do_keyreplace(list, key, position, new_list, new_tuple) do
    current_value = hd(list)

    new_list = if elem(current_value, position) == key do
      new_list ++ [new_tuple]
    else
      new_list ++ [current_value]
    end

    do_keyreplace(tl(list), key, position, new_list, new_tuple)
  end

  def zip(list_of_lists) do
    Elixir.Core.Functions.zip(list_of_lists)
  end
end
