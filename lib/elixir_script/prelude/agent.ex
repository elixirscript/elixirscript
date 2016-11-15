defmodule ElixirScript.Agent do
    @moduledoc false

  def start(fun, options \\ []) do
    pid = spawn(fn() -> Process.sleep(:infinity) end)

    if Elixir.Keyword.has_key?(options, :name) do
      Process.register(pid, Elixir.Keyword.get(options, :name))
    end

    Elixir.Core.Store.create(pid, fun.())
    { :ok, pid }
  end

  def start_link(fun, options \\ []) do
    pid = spawn_link(fn() -> Process.sleep(:infinity) end)

    if Elixir.Keyword.has_key?(options, :name) do
      Process.register(pid, Elixir.Keyword.get(options, :name))
    end

    Elixir.Core.Store.create(pid, fun.())
    { :ok, pid }
  end

  def stop(agent) do
    Process.exit(agent)
    :ok
  end

  def update(agent, fun) do
    pid = Elixir.Core.processes.pidof(agent)
    current_state = Elixir.Core.Store.read(pid)
    Elixir.Core.Store.update(pid, fun.(current_state))
    :ok
  end

  def get(agent, fun) do
    pid = Elixir.Core.processes.pidof(agent)
    current_state = Elixir.Core.Store.read(pid)
    fun.(current_state)
  end

  def get_and_update(agent, fun) do
    pid = Elixir.Core.processes.pidof(agent)
    current_state = Elixir.Core.Store.read(pid)
    {val, new_state} = fun.(current_state)
    Elixir.Core.Store.update(pid, new_state)
    val
  end

end
