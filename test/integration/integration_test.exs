defmodule ElixirScript.Integration.Test do
  use ExUnit.Case
  import Helpers

  test "Atom.to_string" do
    val = call_compiled_function Atom, :to_string, [:atom]
    assert val == "atom"
  end
end
