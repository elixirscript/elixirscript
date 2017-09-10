defmodule ElixirScript.TermConverter do

  def encode(nil), do: "null"
  def encode(term) when is_boolean(term) or is_number(term), do: to_string(term)
  def encode(term) when is_binary(term), do: "'#{term}'"
  def encode(term) when is_atom(term), do: "Symbol.for('#{to_string(term)}')"
  def encode(term) when is_list(term) do
    terms = term
    |> Enum.map(fn(x) -> encode(x) end)
    |> Enum.join(",")

    "[#{terms}]"
  end

  def encode(term) when is_map(term) do
    terms = term
    |> Enum.map(fn({key, term}) ->
      key = encode(key)
      term = encode(term)

      "[#{key}, #{term}]"
    end)
    |> Enum.join(",")

    "[#{terms}]"
  end

  def encode(term) when is_tuple(term) do
    terms = term
    |> Tuple.to_list
    |> Enum.map(fn(x) -> encode(x) end)
    |> Enum.join(",")

    "new ElixirScript.Core.Tuple(#{terms})"
  end

  def decode("@@@" <> term) do
    String.to_atom(term)
  end

  def decode(term) when is_binary(term) or is_boolean(term) or is_number(term) or is_nil(term) do
    term
  end

  def decode(term) when is_list(term) do
    Enum.map(term, &decode/1)
  end

  def decode(%{"length" => _, "terms" => terms}) do
    List.to_tuple(terms)
  end

  def decode(%{"__type__" => "map", "values" => values}) do
    Enum.map(values, fn [key, term] -> {decode(key), decode(term)} end)
    |> Enum.into(%{})
  end
end
