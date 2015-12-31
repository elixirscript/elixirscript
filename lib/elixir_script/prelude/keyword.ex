defmodule ElixirScript.Keyword do

  def has_key?(kw, key) do
    do_has_key?(kw, key)
  end

  defp do_has_key?([], _) do
    false
  end

  defp do_has_key?(kw, key) do
    case hd(kw) do
      {the_key, _} when the_key == key ->
        true
      _ ->
        do_has_key?(tl(kw), key)
    end
  end

  def get(kw, key) do
    get(kw, key, nil)
  end

  def get(kw, key, default) do
    case has_key?(kw, key) do
      true ->
        do_get(kw, key)
      false ->
        default
    end
  end

  defp do_get(kw, key) do
    case hd(kw) do
      { kw_key, value } when kw_key == key ->
        value
      _ ->
        do_get(tl(kw), key)
    end
  end
end
