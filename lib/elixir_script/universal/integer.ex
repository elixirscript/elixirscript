defmodule ElixirScript.Integer do

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

end
