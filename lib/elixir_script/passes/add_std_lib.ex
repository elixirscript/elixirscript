defmodule ElixirScript.Passes.AddStdLib do
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    State.deserialize(ElixirScript.get_stdlib_state, [])
    compiler_data
  end

end
