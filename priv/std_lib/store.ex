defmodule ElixirScript.Store do

  defp get_key(key) do

    real_key = case JS.__elixirscript_names__.has(key) do
                 true ->
                   JS.__elixirscript_names__.get(key)
                 false ->
                   key
               end


    case JS.__elixirscript_store__.has(real_key) do
      true ->
        real_key
      false ->
        JS.throw JS.new(JS.Error, ["Key Not Found"])
    end
  end

  def create(key, value, name \\ nil) do
    if name != nil do
      JS.__elixirscript_names__.set(name, key)
    end

    JS.__elixirscript_store__.set(key, value)
  end

  def update(key, value) do
    real_key = get_key(key)
    JS.__elixirscript_store__.set(real_key, value)
  end

  def read(key) do
    real_key = get_key(key)
    JS.__elixirscript_store__.get(real_key)
  end

  def remove(key) do
    real_key = get_key(key)
    JS.__elixirscript_store__.delete(real_key)
  end


end
