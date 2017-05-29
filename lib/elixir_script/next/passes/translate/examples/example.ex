defmodule Example do
  def start(_, _) do
receive do
  {:selector, i, value} when is_integer(i) ->
    value
  value when is_atom(value) ->
    value
  _ ->
    IO.puts :stderr, "Unexpected message received"
after
  5000 ->
    IO.puts :stderr, "No message in 5 seconds"
end
  end

end
