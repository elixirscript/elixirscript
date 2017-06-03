defmodule ElixirScript.CLI.Test do
  use ExUnit.Case

  test "parse_args -js-module includes js module" do
    {_, args} = ElixirScript.CLI.parse_args(["Example", "--js-module", "React:react"])
    assert args == [js_module: "React:react"]
  end
end
