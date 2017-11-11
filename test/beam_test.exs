defmodule ElixirScript.Beam.Test do
  use ExUnit.Case

  test "can get ast from beam" do
    assert {:ok, _} = ElixirScript.Beam.debug_info(Atom)
  end

  test "errors when not found" do
    assert {:error, _} = ElixirScript.Beam.debug_info(Some.Module)
  end

  test "can get ast from beam that is protocol" do
    assert {:ok, Enumerable, _, _} = ElixirScript.Beam.debug_info(Enumerable)
  end
end
