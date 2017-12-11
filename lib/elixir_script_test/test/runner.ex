defmodule ElixirScript.Test.Runner do
  @moduledoc """
  Defines a behaviour for an ElixirScript Test runner
  """

  @doc """
  Callback for running the test runner.
  Receives a list of JavaScript files from the
  compiled Elixir code. Expects an exit status
  representing the success or failure of the
  tests
  """
  @callback run([binary]) :: integer
end
