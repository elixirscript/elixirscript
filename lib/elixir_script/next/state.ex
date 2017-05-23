defmodule ElixirScript.State do
  def start_link(compiler_opts) do
    Agent.start_link(fn ->
      %{
        compiler_opts: compiler_opts, 
        modules: Keyword.new,
        refs: []
      }
    end)
  end

  def stop(pid) do
    Agent.stop(pid)
  end

  def get_module(pid, module) do
    Agent.get(pid, fn(state) ->
      Keyword.get(state.modules, module)
    end)
  end

  def put_module(pid, module, value) do
    Agent.update(pid, fn(state) ->
      value = Map.put(value, :used, [])
      %{ state | modules: Keyword.put(state.modules, module, value) }
    end)
  end

  def add_used(pid, module, {_function, _arity} = func) do
    Agent.update(pid, fn(state) ->
      module_info = Keyword.get(state.modules, module)
      
      used = Map.get(module_info, :used, [])
      used = used ++ [func]

      module_info = Map.put(module_info, :used, used)
      modules = Keyword.put(state.modules, module, module_info)

      %{ state | modules: modules }
    end)
  end

  def get_javascript_modules(pid) do
    Agent.get(pid, fn(state) ->
      Map.get(state.compiler_opts, :js_modules, [])
      |> Enum.map(fn({module_name, _path}) ->
        module_name
      end)
    end)
  end

  def list_modules(pid) do
    Agent.get(pid, fn(state) ->
      state.modules
    end) 
  end
end