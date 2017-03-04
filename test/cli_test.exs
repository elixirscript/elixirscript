defmodule ElixirScript.CLI.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "parse_args -e expands to elixir" do
    {_, args} = ElixirScript.CLI.parse_args(["1 + 1", "-e"])
    assert args == [elixir: true]
  end
end
