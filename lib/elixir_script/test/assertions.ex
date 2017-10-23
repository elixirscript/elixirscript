defmodule ElixirScript.Test.Assertions do
  def assert(value) do
    if !value do
      ElixirScript.JS.throw(%ElixirScript.Test.AssertionError{
        message: "failed"
      })
    end
  end
end
