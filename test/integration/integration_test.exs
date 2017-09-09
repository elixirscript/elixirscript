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
end
