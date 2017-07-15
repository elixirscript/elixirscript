defmodule ElixirScript.Compiler.Test do
  use ExUnit.Case

  test "Can compile one entry module" do
    result = ElixirScript.Compiler.compile(Version)
    assert is_binary(result)
  end

  test "Use defined module with FFI module" do
    result = ElixirScript.Compiler.compile(Main)
    assert is_binary(result)
    assert result =~ "import Data_JSON from './data/json'"
  end

  test "Can compile multiple entry modules" do
    result = ElixirScript.Compiler.compile([Atom, String, Agent])
    assert is_binary(result)
  end

  test "Error on unknown module" do
    assert_raise ElixirScript.CompileError, fn ->
      ElixirScript.Compiler.compile(SomeModule)
    end
  end

  test "Output format: es" do
    result = ElixirScript.Compiler.compile(Atom, [format: :es, js_modules: [{React, "react"}, {ReactDOM, "react-dom", default: false}]])
    assert result =~ "export default Elixir"
  end

  test "Output format: umd" do
    result = ElixirScript.Compiler.compile(Atom, [format: :umd, js_modules: [{React, "react"}]])
    assert result =~ "factory"
  end

  test "Output format: common" do
    result = ElixirScript.Compiler.compile(Atom, [format: :common, js_modules: [{React, "react"}]])
    assert result =~ "module.exports = Elixir"
  end

  test "Output file with default name" do
    path = System.tmp_dir()

    result = ElixirScript.Compiler.compile(Atom, [output: path])
    assert File.exists?(Path.join([path, "Elixir.App.js"]))
  end

  test "Output file with custom name" do
    path = System.tmp_dir()
    path = Path.join([path, "myfile.js"])

    result = ElixirScript.Compiler.compile(Atom, [output: path])
    assert File.exists?(path)
  end
end