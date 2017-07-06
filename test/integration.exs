defmodule ElixirScript.Compiler.Test do
  use ExUnit.Case
  import Helpers

  test "Compiles a case returning an array correctly" do
    val = call_compiled_func IntegrationTestModule, :case_return_array
    assert val == [1, 2]
  end
end