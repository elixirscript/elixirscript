defmodule ElixirScript.Agent do
  @moduledoc false
  require JS

  def start(fun, options \\ []) do
    pid = JS.new Bootstrap.Core.PID, []

    name = if Elixir.Keyword.has_key?(options, :name) do
      Elixir.Keyword.get(options, :name)
    else
      nil
    end

    Bootstrap.Core.Store.create(pid, fun.(), name)
    { :ok, pid }
  end

  def start_link(fun, options \\ []) do
    pid = JS.new Bootstrap.Core.PID, []

    name = if Elixir.Keyword.has_key?(options, :name) do
      Elixir.Keyword.get(options, :name)
    else
      nil
    end

    Bootstrap.Core.Store.create(pid, fun.(), name)
    { :ok, pid }
  end

  def stop(agent) do
    Bootstrap.Core.Store.remove(agent)
    :ok
  end

  def update(agent, fun) do
    current_state = Bootstrap.Core.Store.read(agent)
    Bootstrap.Core.Store.update(agent, fun.(current_state))
    :ok
  end

  def get(agent, fun) do
    current_state = Bootstrap.Core.Store.read(agent)
    fun.(current_state)
  end

  def get_and_update(agent, fun) do
    current_state = Bootstrap.Core.Store.read(agent)
    {val, new_state} = fun.(current_state)
    Bootstrap.Core.Store.update(agent, new_state)
    val
  end

end
