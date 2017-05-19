defmodule ElixirScript.Beam.Test do
  use ExUnit.Case

  test "can get ast from beam" do
    assert {:ok, map} = ElixirScript.Beam.debug_info(Atom)
    IO.inspect map
  end
end
