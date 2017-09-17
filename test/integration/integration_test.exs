defmodule ElixirScript.Integration.Test do
  use ExUnit.Case
  import Helpers

  test "Atom.to_string" do
    val = call_compiled_function Atom, :to_string, [:atom]
    assert val == "atom"
  end

  test "String interpolation with number" do
    val = call_compiled_function Integration, :test_string_interpolation, []
    assert val == "5"
  end

  test "shorthand failure" do
    val = call_compiled_function Integration, :shorthand_failure, []
    assert val == [
      [:option, %{value: "test@hotmail.com"}, "test@hotmail.com"],
      [:option, %{value: "test2@hotmail.com"}, "test2@hotmail.com"]
    ]
  end

  test "map equals" do
    val = call_compiled_function Integration, :map_equals, []
    assert val == true
  end

  test "multi-remote call" do
    val = call_compiled_function Integration, :multi_field_call, []
    assert val == "5,000,000"
  end

  test "filter names in guards" do
    val = call_compiled_function Integration, :filter_names_in_guards, []
    assert val == true
  end

  test "tuple_get" do
    val = call_compiled_function Integration, :tuple_get, []
    assert val == 5
  end
end
