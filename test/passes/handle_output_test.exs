defmodule ElixirScript.Passes.HandleOutput.Test do
  use ExUnit.Case
  alias ElixirScript.Passes.HandleOutput

  test "get_js_path output: nil" do
    assert HandleOutput.get_js_path(nil) == "Elixir.App.js"
  end

  test "get_js_path output: stdout" do
    assert HandleOutput.get_js_path(:stdout) == "Elixir.App.js"
  end

  test "get_js_path output is directory" do
    assert HandleOutput.get_js_path("/path/to/file/") == "/path/to/file/Elixir.App.js"
    assert HandleOutput.get_js_path("/path/to/file") == "/path/to/file/Elixir.App.js"
  end

  test "get_js_path output ends in js" do
    assert HandleOutput.get_js_path("/path/to/file/myfile.js") == "/path/to/file/myfile.js"
  end
end