defmodule ElixirScript.Compiler.Test do
  use ExUnit.Case

  test "Can compile one entry module" do
    result = ElixirScript.Compiler.compile(Version)
    assert result |> Map.to_list |> hd |> elem(1) |> Map.get(:js_code) |> is_binary
  end

  test "Can compile multiple entry modules" do
    result = ElixirScript.Compiler.compile([Atom, String, Agent])
    assert result |> Map.to_list |> hd |> elem(1) |> Map.get(:js_code) |> is_binary
  end

  test "Output" do
    result = ElixirScript.Compiler.compile(Atom, [])
    assert result |> Map.to_list |> hd |> elem(1) |> Map.get(:js_code) =~ "export default"
  end

  test "compile file" do
    path = System.tmp_dir()
    path = Path.join([path, "Elixir.ElixirScript.Beam.Test.js"])

    input_path = Path.join([File.cwd!(), "test", "beam_test.exs"])

    ElixirScript.Compiler.compile(input_path, [output: path])
    assert File.exists?(path)
    assert String.contains?(File.read!(path), "export default")
  end

  test "compile wildcard" do
    path = System.tmp_dir()
    file = Path.join([path, "Elixir.ElixirScript.FFI.Test.js"])

    input_path = Path.join([File.cwd!(), "test", "*fi_test.exs"])

    ElixirScript.Compiler.compile(input_path, [output: path])
    assert File.exists?(file)
    assert String.contains?(File.read!(file), "export default")
  end
end
