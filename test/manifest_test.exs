defmodule ElixirScript.Manifest.Test do
  use ExUnit.Case
  alias ElixirScript.Manifest

  test "write manifest" do
    result = ElixirScript.Compiler.compile(Atom)
    path = Path.join([System.tmp_dir(), "write_manifest_test", ".compile.elixir_script"])
    Manifest.write_manifest(path, result)
    assert File.exists?(path)
  end

end
