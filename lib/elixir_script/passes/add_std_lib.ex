defmodule ElixirScript.Passes.AddStdLib do
    @moduledoc false  
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    State.deserialize(compiler_data.state, ElixirScript.get_stdlib_state, [])
    compiler_data
  end

end
