defmodule ElixirScript.Experimental.ModuleState do
  def start_link(module) do
    Agent.start_link(fn -> %{ module: module, refs: [] } end)
  end

  def stop(pid) do
    Agent.stop(pid)
  end

  def put_module_ref(pid, module) do
    Agent.update(pid, fn(x) ->
      %{x | refs: Enum.uniq([module | x.refs]) }
    end)
  end

  def get_module_refs(pid) do
    Agent.get(pid, fn(x) ->
      x.refs
    end)    
  end
end