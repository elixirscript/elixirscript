defmodule ElixirScript.FFI.Test do
  use ExUnit.Case

  defmodule MyTestModule do
    use ElixirScript.FFI

    defexternal my_test_function(arg1, arg2)
  end

  test "FFI module has __foreign_info__ attribute" do
    assert Keyword.has_key?(MyTestModule.__info__(:attributes), :__foreign_info__)
  end

  test "FFI module makes foreign function" do
    assert Keyword.has_key?(MyTestModule.__info__(:functions), :my_test_function)
  end
end
