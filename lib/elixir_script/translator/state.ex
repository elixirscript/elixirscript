# This agent holds references to the compiler options, a map all of the modules, and
# a map of modules that define the standard library.
#
# The modules map has the module's name a the key and a ElixirScript.Module struct as the value.
#
# The std_lib_map holds a mapping of the Elixir standard lib module to the
# version implemented here in ElixirScript.
defmodule ElixirScript.Translator.State do
  @moduledoc false
  alias ElixirScript.Translator.Utils

  def start_link(compiler_opts, loaded_modules) do
    Agent.start_link(fn ->
      %{ compiler_opts: compiler_opts, modules: Keyword.new, std_lib_map: build_standard_lib_map(), loaded_modules: [JS | loaded_modules] }
    end)
  end

  def serialize(pid) do
    Agent.get(pid, fn(state) ->
      modules = state.modules
      modules = Enum.map(modules, fn {m, d} ->
        d = Map.delete(d, :javascript_ast)
        |> Map.delete(:javascript_module)
        |> Map.delete(:javascript_code)
        |> Map.delete(:javascript_name)

        {m, d}
      end)
      |> Enum.filter(fn {_, d} -> d.type != :consolidated end)

      state = Map.delete(state, :changed_modules)
      |> Map.put(:modules, modules)

      :erlang.term_to_binary(state)
    end)
  end

  def deserialize(pid, frozen_state, loaded_modules \\ []) do
    Agent.update(pid, fn state ->
      frozen_state = :erlang.binary_to_term(frozen_state)
      modules = Keyword.delete(frozen_state.modules, ElixirScript.Temp)
      %{ state | modules: modules, std_lib_map: frozen_state.std_lib_map, loaded_modules: [JS | loaded_modules] }
    end)
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
    |> Map.put(Keyword, ElixirScript.Keyword)
    |> Map.put(Bitwise, ElixirScript.Bitwise)
    |> Map.put(MapSet, ElixirScript.MapSet)
    |> Map.put(List, ElixirScript.List)
    |> Map.put(Process, ElixirScript.Process)
    |> Map.put(Regex, ElixirScript.Regex)
  end

  def set_module_data(pid, module_data) do
    Agent.update(pid, fn state ->
      data = Enum.filter(state.modules, fn {module_name, data} -> data.app == :elixir end)
      %{ state | modules: Keyword.merge(data, module_data) }
    end)
  end

  def get_module_data(pid) do
    Agent.get(pid, fn state ->
      state.modules
    end)
  end

  def set_loaded_modules(pid, modules) do
    Agent.update(pid, fn state ->
      %{ state | loaded_modules: [ JS | modules ] }
    end)
  end

  def get(pid) do
    Agent.get(pid, &(&1))
  end

  def get_module_name(pid, {:__aliases__, _, _} = name) do
    get_module_name(pid, Utils.quoted_to_name(name))
  end

  def get_module_name(pid, module_name) do
    Agent.get(pid, fn(state) ->
      do_get_module_name(module_name, state)
    end)
  end

  defp do_get_module_name(module_name, state) do
    std_lib_map = state.std_lib_map
    case Map.get(std_lib_map, module_name) do
      nil ->
        module_name
      actual_module_name ->
        actual_module_name
    end
  end

  def is_module_loaded?(pid, module) when is_atom(module) do
    Agent.get(pid, fn(state) ->
      (module in state.loaded_modules)
    end)
  end

  def is_module_loaded?(pid, {:__aliases__, _, _} = module) do

    is_module_loaded?(pid, Utils.quoted_to_name(module))
  end

  def get_module(pid, module) when is_atom(module) do
    do_get_module(pid, module)
  end

  def get_module(pid, {:__aliases__, _, _} = name) do
    do_get_module(pid, Utils.quoted_to_name(name))
  end

  def get_module(pid, module_name_list) when is_list(module_name_list) do
    do_get_module(pid, Utils.quoted_to_name({:__aliases__, [], module_name_list}))
  end

  defp do_get_module(pid, name) do
    Agent.get(pid, fn(state) ->
      Keyword.get(state.modules, do_get_module_name(name, state))
    end)
  end

  def add_module_reference(pid, module_name, module_ref) do
    Agent.update(pid, fn(state) ->
      case Keyword.get(state.modules, do_get_module_name(module_name, state)) do
        nil ->
          state
        module ->
          module = Map.update(module, :deps, [module_ref], fn(x) -> Enum.uniq(x ++ [module_ref]) end)
          modules = Keyword.put(state.modules, module.name, module)
          %{ state | modules: modules }
      end
    end)
  end

  def get_module_references(pid, module_name) do
    case get_module(pid, module_name) do
      nil ->
        []
      module ->
        Map.get(module, :deps, [])
    end
  end

  def list_modules(pid) do
    Agent.get(pid, fn(state) ->
      Keyword.values(state.modules)
    end)
  end

  def list_module_names(pid) do
    Agent.get(pid, fn(state) ->
      Keyword.keys(state.modules)
    end)
  end

  def stop(pid) do
    Agent.stop(pid)
  end

  def add_javascript_module_reference(pid, module_name, name, path, default \\ true) do
    Agent.update(pid, fn(state) ->
      case Keyword.get(state.modules, do_get_module_name(module_name, state)) do
        nil ->
          state
        module ->
          module = Map.update(module, :js_modules, [{name, path, default}], fn(x) -> Enum.uniq(x ++ [{name, path, default}]) end)
          modules = Keyword.put(state.modules, module.name, module)
          %{ state | modules: modules }
      end
    end)
  end

  def get_javascript_module_references(pid, module_name) do
    case get_module(pid, module_name) do
      nil ->
        []
      module ->
        Map.get(module, :js_modules, [])
    end
  end
end
