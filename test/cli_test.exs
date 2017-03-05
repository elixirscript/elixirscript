defmodule ElixirScript.CLI.Test do
  use ExUnit.Case

  test "parse_args -e expands to elixir" do
    {_, args} = ElixirScript.CLI.parse_args(["1 + 1", "-e"])
    assert args == [elixir: true]
  end
end
