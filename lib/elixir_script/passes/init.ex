defmodule ElixirScript.Passes.Init do
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    State.start_link(opts, [])
    compiler_data
  end

end
