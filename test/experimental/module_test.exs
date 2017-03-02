defmodule ElixirScript.Experimental.Module.Test do
  use ExUnit.Case
  alias ESTree.Tools.Builder, as: J 
  alias ElixirScript.Experimental.Module   

  test "compile empty module" do
    args = [
      attrs: [], 
      defs: [],
      file: "example.ex",
      line: 1, 
      module: Example,
      opts: [],
      unreachable: []
    ]

    result = Module.compile(
      args[:line],
      args[:file],
      args[:module],
      args[:attrs],
      args[:defs],
      args[:unreachable],
      args[:opts]
    )

    assert result == J.program([])
  end

  test "compile module with unreachable" do
    args = [
      attrs: [], 
      defs: [{{:hello, 0}, :defp, [line: 4], [{[line: 4], [], [], nil}]}],
      file: "example.ex",
      line: 1, 
      module: Example,
      opts: [],
      unreachable: [hello: 0]
    ]

    result = Module.compile(
      args[:line],
      args[:file],
      args[:module],
      args[:attrs],
      args[:defs],
      args[:unreachable],
      args[:opts]
    )

    assert result == J.program([])
  end
end