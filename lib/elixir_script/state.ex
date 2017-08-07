defmodule ElixirScript.State do
  @moduledoc false

  # Holds the state for the ElixirScript compiler

  def start_link(compiler_opts) do
    Agent.start_link(fn ->
      %{
        compiler_opts: compiler_opts,
        modules: Keyword.new,
        refs: [],
        js_modules: []
      }
    end)
  end

  def stop(pid) do
    Agent.stop(pid)
  end

  def get_compiler_opts(pid) do
    Agent.get(pid, fn(state) ->
      state.compiler_opts
    end)
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

  def has_used?(pid, module, func) do
    Agent.get(pid, fn(state) ->
      module_info = Keyword.get(state.modules, module)
      Enum.find(module_info.used, fn(x) -> x == func end) != nil
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

  def put_javascript_module(pid, module, name, path) do
    Agent.update(pid, fn(state) ->
      js_modules = Map.get(state, :js_modules, [])
      js_modules = js_modules ++ [{module, name, path}]
      %{ state | js_modules: js_modules }
    end)
  end

  def list_javascript_modules(pid) do
    Agent.get(pid, fn(state) ->
      state.js_modules
      |> Enum.map(fn
        {module, _name, _path} ->
          module
      end)
    end)
  end

  def js_modules(pid) do
    Agent.get(pid, fn(state) ->
      state.js_modules
    end)
  end

  def get_js_module_name(pid, module) do
    Agent.get(pid, fn(state) ->
      {_, name, _} = state.js_modules
      |> Enum.find(fn {m, _, _} -> module == m end)
      name
    end)
  end

  def list_foreign_modules(pid) do
    Agent.get(pid, fn(state) ->
      state.modules
      |> Enum.filter(fn
        (%{attributes: [__foreign_info__: _]}) -> true
        (_) -> false
      end)
    end)
  end

  def list_modules(pid) do
    Agent.get(pid, fn(state) ->
      state.modules
    end)
  end
end
