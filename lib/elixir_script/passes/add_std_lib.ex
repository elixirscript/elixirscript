defmodule ElixirScript.Passes.AddStdLib do
    @moduledoc false  
  alias ElixirScript.Translator.State

  def execute(compiler_data, _) do
    State.deserialize(ElixirScript.get_stdlib_state, [])
    compiler_data
  end

end
