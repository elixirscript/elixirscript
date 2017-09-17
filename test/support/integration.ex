defmodule Integration do
  @moduledoc false

  def test_string_interpolation do
    "#{5}"
  end

  def shorthand_failure do
    orders = [%{email: "test@hotmail.com"},%{email: "test2@hotmail.com"}]
    Enum.reduce(orders, [],
    &(&2 ++ [ [:option, %{value: &1.email}, &1.email] ]))
  end

  def map_equals do
    map1 = %{test: "map"}
    map2 = %{test: "map"}
    map1 == map2
  end

  def multi_field_call do
    map = %{token_count: 5000000}
    map.token_count.toLocaleString()
  end

  def filter_names_in_guards do
    has? = 5

    case 5 do
      _ when has? == 5 ->
        true
    end
  end

  def tuple_get do
    map = %{{1} => 5}
    Map.get(map, {1})
  end
end
