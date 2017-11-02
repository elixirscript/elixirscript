defmodule ElixirScript.Try.Test do
  use ElixirScript.Test

  test "returns value in try if no error" do
    value = try do
      1 + 1
    rescue
      _ ->
        3
    end

    assert value == 2
  end

  test "returns rescue value on error" do
    value = try do
      raise ArithmeticError
    rescue
      _ ->
        3
    end

    assert value == 3
  end

  test "returns rescue value from matching error" do
    value = try do
      raise ArithmeticError
    rescue
      ArithmeticError ->
        3
    end

    assert value == 3
  end

  test "returns rescue value from matching errors" do
    value = try do
      raise ArithmeticError
    rescue
      _ in [ArithmeticError, ArgumentError] ->
        3
    end

    assert value == 3
  end

end
