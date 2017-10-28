defmodule ElixirScript.Integration.Test do
  use ElixirScript.Test

  setup do
    [item: true]
  end

  test "Something" do
    assert {:ok, 2} = {:ok, 1}
  end

  test "Atom.to_string" do
    val = Atom.to_string(:atom)
    assert val == "atom"
  end

  test "String interpolation with number" do
    val = "#{5}"
    assert val == "5"
  end

  test "shorthand failure" do
    orders = [%{email: "test@hotmail.com"},%{email: "test2@hotmail.com"}]

    val = Enum.reduce(orders, [],
    &(&2 ++ [ [:option, %{value: &1.email}, &1.email] ]))

    assert val == [
      [:option, %{value: "test@hotmail.com"}, "test@hotmail.com"],
      [:option, %{value: "test2@hotmail.com"}, "test2@hotmail.com"]
    ]
  end

  test "map equals" do
    map1 = %{test: "map"}
    map2 = %{test: "map"}

    assert map1 == map2
  end

  test "multi-remote call" do
    map = %{token_count: 5_000_000}
    val = map.token_count.toLocaleString()

    assert val == "5,000,000"
  end

  test "filter names in guards" do
    has? = 5

    val = case 5 do
      _ when has? == 5 ->
        true
    end

    assert val == true
  end

  test "tuple_get" do
    map = %{{1} => 5}
    val = Map.get(map, {1})

    assert val == 5
  end

  test "multi_bind" do
    [_a | _] = val = [1, 2, 3, 4, 5]
    assert val == [1, 2, 3, 4, 5]
  end
end
