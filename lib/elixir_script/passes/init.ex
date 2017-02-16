defmodule ElixirScript.Passes.Init do
  @moduledoc false    
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    {:ok, pid} = State.start_link(opts, [])
    Map.put(compiler_data, :state, pid)
  end

end
