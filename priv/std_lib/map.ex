defmodule ElixirScript.Map do
  @moduledoc false

  def new() do
    %{}
  end

  def keys(map) do
    ElixirScript.Bootstrap.Functions.get_object_keys(map)
  end

  def size(map) do
    keys(map).length
  end

  def to_list(map) do
    do_to_list(map, [])
  end

  def do_to_list(map, list) do
    case size(map) do
      0 ->
        list
      _ ->
        key = hd(keys(map))
        value = map[key]
        do_to_list(Map.delete(map, key), list ++ [{key, value}])
    end
  end

  def values(map) do
    JS.Object.values(map)
  end

  def from_struct(struct) do
    struct
    |> ElixirScript.Bootstrap.Functions.class_to_obj
    |> delete(:__struct__)
  end

  def delete(map, key) do
    map
    |> ElixirScript.Bootstrap.Functions.delete_property_from_map(key)
  end

  def equal?(map1, map2) do
    map1 === map2
  end

  def fetch!(map, key) do
    case key in keys(map) do
      true ->
        map[key]
      false ->
        raise "#{key} not found in map"
    end
  end

  def fetch(map, key) do
    case key in keys(map) do
      true ->
        { :ok, map[key] }
      false ->
        :error
    end
  end

  def has_key?(map, key) do
    key in keys(map)
  end

  def merge(map1, map2) do
    JS.Object.assign(%{}, map1, map2)
    |> JS.Object.freeze()
  end

  def split(map, keys) do
    do_split(map, keys, { %{}, %{} })
  end

  defp do_split(_, [], split_tuple) do
    split_tuple
  end

  defp do_split(map, keys, { key_map, non_key_map }) do
    key = hd(keys)

    new_split_tuple = case key in keys(map) do
      true ->
        { Map.put(key_map, key, map[key]), non_key_map }
      false ->
        { key_map, Map.put(non_key_map, key, map[key]) }
    end

    do_split(map, tl(keys), new_split_tuple)
  end

  def take(map, keys) do
    {key_map, _} = split(map, keys)
    key_map
  end

  def drop(map, keys) do
    {_, non_key_map} = split(map, keys)
    non_key_map
  end

  def put_new(map, key, value) do
    case key in keys(map) do
      true ->
        map
      false ->
        Map.put(map, key, value)
    end
  end

  def put_new_lazy(map, key, func) do
    case key in keys(map) do
      true ->
        map
      false ->
        Map.put(map, key, func.())
    end
  end

  def put(map, key, value) do
    ElixirScript.Bootstrap.Functions.add_property_to_map(map, key, value)
  end

  def get(map, key) do
    get(map, key, nil)
  end

  def get(map, key, default_value) do
    case key in keys(map) do
      true ->
        map[key]
      false ->
        default_value
    end
  end

  def get_lazy(map, key, func) do
    case key in keys(map) do
      true ->
        func.(map[key])
      false ->
        func.()
    end
  end

  def get_and_update(map, key, func) do
    case key in keys(map) do
      true ->
        { nil, map }
      false ->
        new_value = func.(map[key])
        { new_value, Map.put(map, key, new_value) }
    end
  end

  def pop(map, key) do
    pop(map, key, nil)
  end

  def pop(map, key, default_value) do
    case key in keys(map) do
      true ->
        { map[key], Map.delete(map, key) }
      false ->
        { default_value, map }
    end
  end

  def pop_lazy(map, key, func) do
    case key in keys(map) do
      true ->
        { func.(map[key]), Map.delete(map, key) }
      false ->
        { func.(), map }
    end
  end


  def update!(map, key, func) do
    case key in keys(map) do
      true ->
        Map.put(map, key, func.(map[key]))
      false ->
        raise "#{key} not found in map"
    end
  end


  def update(map, key, initial, func) do
    case key in keys(map) do
      true ->
        Map.put(map, key, func.(map[key]))
      false ->
        Map.put(map, key, initial)
    end
  end

end
