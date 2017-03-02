defmodule Example do
  @compile {:undocumented_elixir_backend_option, ElixirScript.Experimental.Backend}

  def hello() do
    1
    1.0
    "Hello"
    :hello
    Hello
    {1, 2, 3}
    {1, 2}
    %{a: 1}
    %{"b" => 2}
    <<1, 2, 3>>
    <<1, "foo">>
    <<1, "foo" :: binary>>
    <<1, "foo" :: utf8, "bar" :: utf32>>
    rest = 100
    <<102 :: integer-native, rest :: binary>>    
    <<102, rest :: size(16)>>    
  end
end