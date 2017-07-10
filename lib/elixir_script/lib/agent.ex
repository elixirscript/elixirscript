defmodule ElixirScript.Agent do
  @moduledoc false

  def start(fun, options \\ []) do
    name = if Keyword.has_key?(options, :name) do
      Keyword.get(options, :name)
    else
      nil
    end

    pid = Bootstrap.Core.Store.create(fun.(), name)
    { :ok, pid }
  end

  def start_link(fun, options \\ []) do
    name = if Keyword.has_key?(options, :name) do
      Keyword.get(options, :name)
    else
      nil
    end

    pid = Bootstrap.Core.Store.create(fun.(), name)
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