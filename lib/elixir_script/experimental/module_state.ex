defmodule ElixirScript.Experimental.ModuleState do
  def start_link(module) do
    Agent.start_link(fn -> %{ module: module, refs: [] } end, name: __MODULE__)
  end

  def stop() do
    Agent.stop(__MODULE__)
  end

  def put_module_ref(module) do
    Agent.update(__MODULE__, fn(x) ->
      %{x | refs: Enum.uniq([module | x.refs]) }
    end)
  end

  def get_module_refs() do
    Agent.get(__MODULE__, fn(x) ->
      x.refs
    end)    
  end
end