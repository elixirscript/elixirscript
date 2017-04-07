defmodule User do
  defstruct [:first, :last]

  def throw_something() do
    raise ArgumentError
  end
end

defimpl String.Chars, for: User do
  def to_string(nil) do
    ""
  end

  def to_string(user) do
    user.first <> user.last
  end
end