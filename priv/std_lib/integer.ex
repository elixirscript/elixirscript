defmodule ElixirScript.Integer do
  @moduledoc false
  def is_even(number) do
    rem(number, 2) == 0
  end

  def is_odd(number) do
    rem(number, 2) != 0
  end

  def to_char_list(number, base \\ 10) do
    number.toString(base).split('')
  end

  def parse(bin, base \\ 10) do
    result = JS.parseInt(bin, base)

    if JS.isNaN(result) do
      :error
    else
      case bin.indexOf(".") do
        index_of_dot when index_of_dot < 0 ->
          {result, ""}
        index_of_dot ->
          {result, bin.substring(index_of_dot)}
      end
    end
  end
end
