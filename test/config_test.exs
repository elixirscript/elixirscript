defmodule ElixirScript.Config.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "load configuration" do
    modules = Code.load_file("exjs.exs")

    Enum.each(modules, fn({ module, _ }) -> 
      case module do
        ElixirScript.Config ->
          assert module.project()[:app] == :app
      end
    end)

  end
end