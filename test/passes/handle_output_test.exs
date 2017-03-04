defmodule ElixirScript.Passes.HandleOutput.Test do
  use ExUnit.Case
  alias ElixirScript.Passes.HandleOutput

  test "get_js_name output: nil" do
    assert HandleOutput.get_js_name(nil) == "Elixir.App.js"
  end

  test "get_js_name output: stdout" do
    assert HandleOutput.get_js_name(:stdout) == "Elixir.App.js"
  end

  test "get_js_name output is directory" do
    assert HandleOutput.get_js_name("/path/to/file/") == "Elixir.App.js"
    assert HandleOutput.get_js_name("/path/to/file") == "Elixir.App.js"
  end

  test "get_js_name output ends in js" do
    assert HandleOutput.get_js_name("/path/to/file/myfile.js") == "myfile.js"
  end
end