defmodule ElixirScript.Passes.Init do
  @moduledoc false    
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    State.start_link(opts, [])
    compiler_data
  end

end
