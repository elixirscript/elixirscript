defmodule ElixirScript.Enum do
  
  def all?(enumerable, fun \\ fn(x) -> x end) do
    {_, acc} = Enumerable.reduce(enumerable, {:cont, true}, fn(item, _) ->
      if fun.(item) do
        {:cont, true}
      else
        {:halt, false}
      end
    end)

    acc
  end

  def any?(enumerable, fun \\ fn(x) -> x end) do
    {_, acc} = Enumerable.reduce(enumerable, {:cont, true}, fn(item, _) ->
      if fun.(item) do
        {:halt, true}
      else
        {:cont, false}
      end
    end)

    acc
  end

  def at(enumerable, n, default \\ nil) do
    index = if n < 0 do
      {_, count} = Enumerable.count(enumerable) 
      count + n
    else
      n
    end

    result = Enumerable.reduce(enumerable, {:cont, 0}, fn(item, acc) ->
      if index == acc do
        {:halt, item}
      else
        {:cont, acc + 1}
      end
    end)

    case result do
      {:done, _} ->
        default
      {:halted, item} ->
        item
    end    
  end

  def concat([]) do
    []
  end

  def concat([enumerable]) do
    enumerable
  end

  def concat([h, t]) do
    h.concat(t)
  end

  def concat([h | t]) do
    h.concat(concat(t))
  end

  def concat(h, t) do
    h.concat(t)
  end

  def count(enumerable) do
    {:ok, num} = Enumerable.count(enumerable)
    num
  end

  def count(enumerable, fun) do
    {_, acc} = Enumerable.reduce(enumerable, {:cont, 0}, fn(item, acc) ->
      if fun.(item) do
        {:cont, acc + 1}
      else
        {:cont, acc}
      end
    end)

    acc
  end

  def reduce(enumerable, fun) do
    {_, result} = Enumerable.reduce(enumerable, {:cont, nil}, fn
      item, nil ->
        {:cont, {:acc, item}}
      item, {:acc, acc} ->
        {:cont, {:acc, fun.(item, acc)}}
    end)

    result
  end

  def reduce(enumerable, acc, fun) do
    {_, result} = Enumerable.reduce(enumerable, {:cont, acc}, fn
      item, acc ->
        {:cont, fun.(item, acc)}
    end)

    result
  end


  def map(enumerable, fun) do
    reduce(enumerable, [], fn(x, acc) -> 
      acc ++ fun.(x)
    end)
  end

  def map_reduce(enumerable, acc, fun) do
    reduce(enumerable, {[], acc}, fn(x, {m, acc}) -> 
      {v, new_acc} = fun.(x, acc)
      {m ++ [v], new_acc}
    end)
  end

  def each(enumerable, fun) do
    map(enumerable, fun)
    :ok
  end

  def empty?(enumerable) do
    {:ok, count} = Enumerable.count(enumerable)
    count == 0
  end

  def fetch(enumerable, index) do
    result = Enumerable.reduce(enumerable, {:cont, 0}, fn(item, acc) ->
      if index == acc do
        {:halt, {:ok, item}}
      else
        {:cont, acc + 1}
      end
    end)

    case result do
      {:done, _} ->
        :error
      {:halted, item} ->
        item
    end
  end

  def fetch!(enumerable, index) do
    case fetch(enumerable, index) do
      {:ok, item} ->
        item
      :error ->
        raise Enum.OutOfBoundsError
    end
  end

  def filter(enumerable, fun) do
    reduce(enumerable, [], fn(x, acc) ->
      if fun.(x) do
        acc ++ [x]
      else
        acc
      end
    end)
  end

  def filter_map(enumerable, filter, mapper) do
    reduce(enumerable, [], fn(x, acc) ->
      if filter.(x) do
        acc ++ [mapper.(x)]
      else
        acc
      end
    end)
  end

  def find(enumerable, default \\ nil, fun) do
    {_, result} = Enumerable.reduce(enumerable, {:cont, default}, fn(item, acc) ->
      if fun.(item) do
        {:halt, item}
      else
        {:cont, default}
      end
    end)

    result
  end

  def into(enumerable, collectable) do
    {init, fun} = Collectable.into(collectable)
    reduce(enumerable, init, fn x, acc ->
      fun.(acc, {:cont, x})
    end)
  end

  def into(enumerable, collectable, transform) do
    {init, fun} = Collectable.into(collectable)
    reduce(enumerable, init, fn x, acc ->
      fun.(acc, {:cont, transform.(x)})
    end)
  end

  def member?(enumerable, value) do
    {_, result} = Enumerable.reduce(enumerable, {:cont, false}, fn(item, acc) ->
      if item == value do
        {:halt, true}
      else
        {:cont, false}
      end
    end)

    result
  end

  def drop(enumerable, count) when count < 0 do
    enumerable
    |> reverse
    |> drop(abs(count))
    |> reverse   
  end

  def drop(enumerable, count) do
    {_, {result, _}} = Enumerable.reduce(enumerable, {:cont, {[], 0}}, fn
      (item, {taken, drop_count}) ->
        if drop_count < count do
          {:cont, {[], drop_count + 1 }}
        else
          {:cont, {taken ++ [item], drop_count}}
        end
    end)

    result    
  end

  def drop_every(enumerable, nth) do
      {_, {result, _count}} = Enumerable.reduce(enumerable, {:cont, {[], 0}}, fn
        (item, {taken, count}) ->
          if rem(count, nth) == 0 do
            {:cont, {taken, count + 1}}
          else
            {:cont, {taken ++ [item], count + 1}}
          end
      end)

      result
  end

  def drop_while(enumerable, fun) do
    {_, result} = Enumerable.reduce(enumerable, {:cont, []}, fn
      (item, taken) ->
        if fun.(item) do
          {:cont, {taken}}
        else
          {:cont, taken ++ [item]}
        end
    end)

    result
  end


  def take(enumerable, count) do
    if Enumerable.count(enumerable) < count do
      enumerable
    else
      {_, result} = Enumerable.reduce(enumerable, {:cont, {[], 0}}, fn
        (item, {taken, taken_count}) ->
          if taken_count == count do
            {:halt, taken}
          else
            {:cont, {taken ++ [item], taken_count + 1}}
          end
      end)

      result
    end
  end

  def take_every(enumerable, nth) do
      {_, {result, _count}} = Enumerable.reduce(enumerable, {:cont, {[], 0}}, fn
        (item, {taken, count}) ->
          if rem(count, nth) == 0 do
            {:cont, {taken ++ [item], count + 1}}
          else
            {:cont, {taken, count + 1}}
          end
      end)

      result
  end

  def take_while(enumerable, fun) do
    {_, result} = Enumerable.reduce(enumerable, {:cont, []}, fn
      (item, taken) ->
        if fun.(item) do
          {:cont, {taken ++ [item]}}
        else
          {:halt, taken}
        end
    end)

    result
  end


  def to_list(enumerable) when is_list(enumerable) do
    enumerable
  end

  def to_list(enumerable) do
    map(enumerable, fn x -> x end)
  end

  def reverse(enumerable) when is_list(enumerable) do
    enumerable.concat([]).reverse()
  end

  def reverse(enumerable) do
    reduce(enumerable, [], fn(item, acc) ->
      [item] ++ acc
    end)
  end

  def reverse(enumerable, tail) when is_list(enumerable) do
    enumerable.concat([]).reverse() ++ tail
  end

  def reverse(enumerable, tail) do
    result = reduce(enumerable, [], fn(item, acc) ->
      [item] ++ acc
    end)

    result ++ tail
  end

end