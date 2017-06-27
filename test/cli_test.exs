defmodule ElixirScript.CLI.Test do
  use ExUnit.Case
  import ExUnit.CaptureIO

  test "parse_args" do
    {_, args} = ElixirScript.CLI.parse_args(["Atom", "--format", "umd"])
    assert args == [format: "umd"]
  end

  test "process help" do
    assert capture_io(fn ->
      ElixirScript.CLI.process(:help)
    end) =~ "usage: elixirscript <module> [options]"
  end

  test "process version" do
    assert capture_io(fn ->
      ElixirScript.CLI.process(:version)
    end) =~ Mix.Project.config()[:version]
  end

  test "process unknown" do
    assert capture_io(fn ->
      ElixirScript.CLI.process({"", [unknown: ""]})
    end) =~ "usage: elixirscript <module> [options]"
  end

  test "process input" do
    assert capture_io(fn ->
      ElixirScript.CLI.process({["Atom"], []})
    end) =~ "export default Elixir"
  end

  test "process js modules" do
    assert capture_io(fn ->
      ElixirScript.CLI.process({["Atom"], [js_module: "React:react"]})
    end) =~ "import React from 'react'"
  end
end