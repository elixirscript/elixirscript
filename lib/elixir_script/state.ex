defmodule ElixirScript.State do
  @moduledoc false

  def start_link(root, elixir_env \\ __ENV__) do
    Agent.start_link(fn ->
      %{ root: root, elixir_env: elixir_env, modules: Map.new }
    end, name: __MODULE__)
  end

  def update_env(env) do
    Agent.update(__MODULE__, fn state ->
      %{state | env: env}
    end)
  end

  def add_module(module) do
    Agent.update(__MODULE__, fn state ->
      %{ state | modules: Map.put(state.modules, module.name, module) }
    end)
  end

  def delete_module(module) do
    Agent.update(__MODULE__, fn state ->
      %{ state | modules: Map.delete(state.modules, module.name ) }
    end)
  end

  def delete_module_by_name(module_name) do
    Agent.update(__MODULE__, fn state ->
      %{ state | modules: Map.delete(state.modules, module_name ) }
    end)
  end

  def module_listed?(module_name) do
    Agent.get(__MODULE__, fn state ->
      Map.has_key?(state.modules, module_name)
    end)
  end

  def protocol_listed?(module_name) do
    Agent.get(__MODULE__, fn state ->
      Map.has_key?(state.modules, module_name) && Map.get(state.modules, module_name).type == :protocol
    end)
  end

  def add_protocol(name, spec) do
    Agent.update(__MODULE__, fn state ->
      proto = do_get_module(state, name)

      if proto == nil do
        proto = %ElixirScript.Module{ name: name, spec: spec, impls: HashDict.new, type: :protocol }
      else
        proto = %{proto | spec: spec, type: :protocol }
      end

      %{ state | modules: Map.put(state.modules, name, proto) }
    end)
  end

  def add_protocol_impl(protocol, type, impl) when is_list(type) do
    Enum.each(type, fn x ->
      add_protocol_impl(protocol, x, impl)
    end)
  end

  def add_protocol_impl(protocol, type, impl) do
    Agent.update(__MODULE__, fn state ->
      proto = do_get_module(state, protocol)

      if proto == nil do
        proto = %ElixirScript.Module{ name: protocol, spec: nil, impls: HashDict.new, type: :protocol }
      end

      proto = %{ proto | impls: Dict.put(proto.impls, type, impl), type: :protocol }

      %{ state | modules: Map.put(state.modules, protocol, proto) }
    end)
  end

  def get do
    Agent.get(__MODULE__, &(&1))
  end

  def get_module(module) when is_atom(module) do
    state = Agent.get(__MODULE__, &(&1))
    do_get_module(state, module)
  end

  def get_module({:__aliases__, _, _} = name) do
    state = Agent.get(__MODULE__, &(&1))
    do_get_module(state, ElixirScript.Module.quoted_to_name(name))
  end

  def get_module(module_name_list) when is_list(module_name_list) do
    state = Agent.get(__MODULE__, &(&1))
    do_get_module(state, ElixirScript.Module.quoted_to_name({:__aliases__, [], module_name_list}))
  end

  defp do_get_module(state, name) do
    name = ElixirScript.Module.get_module_name(name)
    Map.get(state.modules, name)
  end

  def add_alias(module_name, module_alias) do
    module = get_module(module_name)

    if module do
      delete_module(module)
      module = %{ module | aliases: MapSet.put(module.aliases, {module_alias, module_name}) }
      add_module(module)
    end
  end

  def add_module_reference(module_name, module_ref) do
    module = get_module(module_name)

    if module do
      delete_module(module)
      module = %{ module | module_refs: Enum.uniq(module.module_refs ++ [module_ref]) }
      add_module(module)
    end
  end

  def get_module_references(module_name) do
    module = get_module(module_name)

    if module do
      module.module_refs
      |> Enum.uniq
    else
      []
    end
  end

  def list_modules() do
    Agent.get(__MODULE__, fn(x) ->
      Map.values(x.modules)
    end)
  end

  def list_module_names() do
    Agent.get(__MODULE__, fn(x) ->
      Map.values(x.modules)
      |> Enum.map(fn(x) -> x.name end)
    end)
  end

  def stop do
    Agent.stop(__MODULE__)
  end
end
