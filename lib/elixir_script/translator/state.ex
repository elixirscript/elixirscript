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
      %{ 
        compiler_opts: compiler_opts, 
        modules: Keyword.new, 
        std_lib_map: build_standard_lib_map(), 
        loaded_modules: [JS | loaded_modules],
        module_references: Keyword.new()
      }
    end)
  end

  defp build_standard_lib_map() do
    Application.spec(:elixir, :modules)
    |> Enum.reduce(Map.new, fn(x, acc) -> 
      try do
        elixirscript_module = (["ElixirScript"] ++ Module.split(x)) |> Module.concat()
        Map.put(acc, x, elixirscript_module)
      rescue
        FunctionClauseError ->
          acc
        ArgumentError ->
          acc
      end
    end)
  end

  def set_module_data(pid, module_data) do
    Agent.update(pid, fn state ->
      %{ state | modules: Keyword.merge(state.modules, module_data) }
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
      case Keyword.get(state.modules, do_get_module_name(module_ref, state)) do
        nil ->
          state
        module ->
          module_references = Keyword.update(state.module_references, module.name, [module_name], fn(x) -> Enum.uniq(x ++ [module_name]) end)
          %{ state | module_references: module_references }
      end
    end)
  end

  def list_module_references(pid) do
    Agent.get(pid, fn(state) ->
      state.module_references
    end)
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
end
