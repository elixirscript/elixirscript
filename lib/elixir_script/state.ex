defmodule ElixirScript.State do
  @moduledoc false

  def start_link(env \\ __ENV__) do
    Agent.start_link(fn -> %ElixirScript.Env{ env: env } end, name: __MODULE__)
  end

  def update_env(env) do
    Agent.update(__MODULE__, fn(state) ->
      %{state | env: env }
    end)
  end

  def add_module(module) do
    Agent.update(__MODULE__, fn(state) ->
      %{ state | modules: Set.put(state.modules, module) }
    end)
  end

  def delete_module(module) do
    Agent.update(__MODULE__, fn(state) ->
      %{ state | modules: Set.delete(state.modules, module) }
    end)
  end

  def module_listed?(module_name) do
    Agent.get(__MODULE__, fn(state) ->
      Enum.any?(state.modules, fn(x) -> x.name == module_name end)
    end)
  end

  def get() do
    Agent.get(__MODULE__, fn(state) ->
      state
    end)
  end

  def get_module(module_name_list) do
    state = Agent.get(__MODULE__, fn(state) ->
      state
    end)

    Enum.find(Set.to_list(state.modules), fn(x) ->
      x.name == module_name_list
    end)
  end

  def stop() do
    Agent.stop(__MODULE__)
  end

end