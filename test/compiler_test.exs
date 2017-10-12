defmodule ElixirScript.Compiler.Test do
  use ExUnit.Case

  test "Can compile one entry module" do
    result = ElixirScript.Compiler.compile(Version)
    assert is_binary(result)
  end

  test "Can compile multiple entry modules" do
    result = ElixirScript.Compiler.compile([Atom, String, Agent])
    assert is_binary(result)
  end

  test "Output" do
    result = ElixirScript.Compiler.compile(Atom, [])
    assert result =~ "export default"
  end

  test "Output file with default name" do
    path = System.tmp_dir()

    ElixirScript.Compiler.compile(Atom, [output: path])
    assert File.exists?(Path.join([path, "elixirscript.build.js"]))
  end

  test "Output file with custom name" do
    path = System.tmp_dir()
    path = Path.join([path, "myfile.js"])

    ElixirScript.Compiler.compile(Atom, [output: path])
    assert File.exists?(path)
  end

  test "compile file" do
    path = System.tmp_dir()
    path = Path.join([path, "myfile.js"])

    input_path = Path.join([File.cwd!(), "test", "beam_test.exs"])

    ElixirScript.Compiler.compile(input_path, [output: path])
    assert File.exists?(path)
    assert String.contains?(File.read!(path), "Elixir.ElixirScript.Beam.Test")
  end

  test "compile wildcard" do
    path = System.tmp_dir()
    file = Path.join([path, "Elixir.ElixirScript.FFI.Test.js"])

    input_path = Path.join([File.cwd!(), "test", "*fi_test.exs"])

    ElixirScript.Compiler.compile(input_path, [output: path])
    assert File.exists?(file)
    assert String.contains?(File.read!(path), "export default")
  end
end
