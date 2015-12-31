defmodule ElixirScript.Translator.State do
  @moduledoc false
  alias ElixirScript.Translator.Utils

  def start_link(compiler_opts \\ []) do
    Agent.start_link(fn ->
      %{ compiler_opts: compiler_opts, modules: Map.new, std_lib_map: build_standard_lib_map() }
    end, name: __MODULE__)
  end

  defp build_standard_lib_map() do
    Map.new
    |> Map.put(Kernel, ElixirScript.Kernel)
    |> Map.put(Tuple, ElixirScript.Tuple)
    |> Map.put(Atom, ElixirScript.Atom)
    |> Map.put(Collectable, ElixirScript.Collectable)
    |> Map.put(String.Chars, ElixirScript.String.Chars)
    |> Map.put(Enumerable, ElixirScript.Enumerable)
    |> Map.put(Integer, ElixirScript.Integer)
    |> Map.put(Macro.Env, ElixirScript.Macro.Env)
    |> Map.put(View, ElixirScript.View)
    |> Map.put(Agent, ElixirScript.Agent)
    |> Map.put(Range, ElixirScript.Range)
    |> Map.put(String, ElixirScript.String)
    |> Map.put(Base, ElixirScript.Base)
    |> Map.put(Module, ElixirScript.Module)
    |> Map.put(Map, ElixirScript.Map)
  end

  def add_module(module) do
    Agent.update(__MODULE__, fn state ->
      %{ state | modules: Map.put(state.modules, module.name, module) }
    end)
  end

  def delete_module_by_name(module_name) do
    Agent.update(__MODULE__, fn state ->
      %{ state | modules: Map.delete(state.modules, module_name ) }
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

  def get_module_name(module_name) do
    case Map.get(build_standard_lib_map, module_name) do
      nil ->
        module_name
      actual_module_name ->
        actual_module_name
    end
  end

  def get_module(module) when is_atom(module) do
    state = Agent.get(__MODULE__, &(&1))
    do_get_module(state, module)
  end

  def get_module({:__aliases__, _, _} = name) do
    state = Agent.get(__MODULE__, &(&1))
    do_get_module(state, Utils.quoted_to_name(name))
  end

  def get_module(module_name_list) when is_list(module_name_list) do
    state = Agent.get(__MODULE__, &(&1))
    do_get_module(state, Utils.quoted_to_name({:__aliases__, [], module_name_list}))
  end

  defp do_get_module(state, name) do
    Map.get(state.modules, get_module_name(name))
  end

  def add_module_reference(module_name, module_ref) do
    module = get_module(module_name)

    if module do
      module = %{ module | module_refs: Enum.uniq(module.module_refs ++ [module_ref]) }
      add_module(module)
    end
  end

  def get_module_references(module_name) do
    case get_module(module_name) do
      nil ->
        []
      module ->
        module.module_refs
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
