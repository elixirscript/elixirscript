defmodule ElixirScript.Test.Assertions do
  def assert(value) do
    if !value do
      raise ElixirScript.Test.AssertionError, message: "failed"
    end
  end
end
