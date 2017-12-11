defmodule ElixirScript.Test.Runner.Node do
  @moduledoc """
  Defines an ElixirScript Test runner using node
  """
  @behaviour ElixirScript.Test.Runner

  def run(js_files) do
    test_script_path = Path.join([:code.priv_dir(:elixir_script), "testrunner", "index.js"])
    test_script_path = [test_script_path] ++ js_files
    {_, exit_status} = System.cmd(
      "node",
      test_script_path,
      into: IO.stream(:stdio, :line)
    )

    exit_status
  end
end
