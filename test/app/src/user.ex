defmodule User do
  defstruct [:first, :last]

  def throw_something() do
    raise ArgumentError
  end
end