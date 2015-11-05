defmodule ElixirScript.State do
  @moduledoc false

  def start_link(root, env \\ __ENV__) do
    Agent.start_link(fn -> %ElixirScript.Env{ root: root, env: env } end, name: __MODULE__)
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
      Enum.any?(state.modules, fn(x) -> x.name == module_name end) ||
      Enum.any?(state.protocols, fn({key, _}) -> key == module_name end)
    end)
  end

  def protocol_listed?(module_name) do
    Agent.get(__MODULE__, fn(state) ->
      Enum.any?(state.protocols, fn({key, _}) -> key == module_name end)
    end)
  end

  def add_protocol(name, spec) do
    Agent.update(__MODULE__, fn(state) ->
      proto = Dict.get(state.protocols, name)

      if proto == nil do
        proto = %{name: name, spec: spec, impls: HashDict.new }
      else
        proto = %{ proto | spec: spec }
      end

      %{ state | protocols: Dict.put(state.protocols, name, proto) }
    end)
  end

  def add_protocol_impl(protocol, type, impl) when is_list(type) do
    Enum.each(type, fn(x) ->
      add_protocol_impl(protocol, x, impl)
    end)
  end

  def add_protocol_impl(protocol, type, impl) do
    Agent.update(__MODULE__, fn(state) ->
      proto = Dict.get(state.protocols, protocol)

      if proto == nil do
        proto = %{name: protocol, spec: nil, impls: HashDict.new }
      end

      proto = %{ proto | impls: Dict.put(proto.impls, type, impl) }

      %{ state | protocols: Dict.put(state.protocols, protocol, proto) }
    end)
  end

  def get() do
    Agent.get(__MODULE__, fn(state) ->
      state
    end)
  end

  def get_module(module_name_list) do
    state = get()

    Enum.find(Set.to_list(state.modules), fn(x) ->
      x.name == module_name_list
    end)
  end

  def get_macro({:__aliases__, _, module_name_list}, macro_name) do
    get_macro(module_name_list, macro_name)
  end

  def get_macro(module_name_list, macro_name) do
    module = get_module(module_name_list)
    if(module) do
      Enum.find(module.macros, fn(%ElixirScript.Macro{ name: name }) -> name == macro_name end)
    else
      nil
    end
  end

  def stop() do
    Agent.stop(__MODULE__)
  end

end
