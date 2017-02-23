defmodule ElixirScript.Passes.JavaScriptName do
  @moduledoc false
  alias ElixirScript.Translator.Utils

  def execute(compiler_data, _) do
    Map.put(compiler_data, :generated_name, "Elixir.App.js")
  end
end
