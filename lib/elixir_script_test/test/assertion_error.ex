defmodule ElixirScript.Test.AssertionError do
  @moduledoc """
  Raised to signal an assertion error.
  """

  @no_value :ex_unit_no_meaningful_value

  defexception left: @no_value,
               right: @no_value,
               message: @no_value,
               expr: @no_value,
               file: @no_value,
               line: @no_value
end
