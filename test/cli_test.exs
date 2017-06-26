defmodule ElixirScript.CLI.Test do
  use ExUnit.Case

  test "parse_args" do
    {_, args} = ElixirScript.CLI.parse_args(["Atom", "--format", "umd"])
    assert args == [format: "umd"]
  end
end