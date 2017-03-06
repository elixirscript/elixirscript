defmodule Example do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  def hello(a) when is_atom(a) or is_binary(a) do
    1
    1.0
    "Hello"
    :hello
    Hello
    {1, 2, 3}
    {1, 2}
    %{a: 1}
    %{"b" => 2}
    []
    [1, 2, 3]
    <<1, 2, 3>>
    <<1, "foo">>
    <<1, "foo" :: binary>>
    <<1, "foo" :: utf8, "bar" :: utf32>>
    rest = 100
    <<102 :: integer-native, rest :: binary>>
    <<102, rest :: size(16)>>
    1 + 1
    Enum.map([1, 2, 3], fn
      x when is_integer(x) -> x * 2 end
    )
    Enum.map([1, 2, 3], &to_string(&1))
    for n <- [1, 2, 3, 4], do: n * 2
  end
end
