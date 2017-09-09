defmodule Integration do
  @moduledoc false

  def test_string_interpolation do
    "#{5}"
  end

  def shorthand_failure do
    orders = [%{email: "test@hotmail.com"},%{email: "test2@hotmail.com"}]
    options = Enum.reduce(orders, [],
    &(&2 ++ [ [:option, %{value: &1.email}, &1.email] ]))
  end
end
