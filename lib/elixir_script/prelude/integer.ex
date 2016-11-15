defmodule ElixirScript.Integer do
  @moduledoc false
  def is_even(number) do
    rem(number, 2) == 0
  end

  def is_odd(number) do
    rem(number, 2) != 0
  end

  def to_char_list(number) do
    to_char_list(number, 10)
  end

  def to_char_list(number, base) do
    number.toString(base).split('')
  end

  def parse(bin) do
    result = Elixir.Core.Functions.get_global().parseInt(bin)

    if Elixir.Core.Functions.get_global().isNaN(result) do
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
