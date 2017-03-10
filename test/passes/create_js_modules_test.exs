defmodule ElixirScript.Passes.CreateJSModules.Test do
  use ExUnit.Case

  import ElixirScript.TestHelper

  alias ElixirScript.Passes.CreateJSModules
  alias ESTree.Tools.Generator

  test "start" do
    start_js = CreateJSModules.start
    |> Generator.generate

    expected_js =
"Elixir.start = function(app, args) {
    app.__load(Elixir).start(Symbol.for('normal'), args)
}"


    assert(start_js == expected_js)
  end

  test "load" do
    load_js = CreateJSModules.load
    |> Generator.generate

    expected_js =
"Elixir.load = function(module) {
    return module.__load(Elixir);
}"

    assert(load_js == expected_js)
  end
end
