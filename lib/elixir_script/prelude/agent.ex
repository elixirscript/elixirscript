defmodule ElixirScript.Agent do

  def start(fun) do
    pid = Elixir.Core.Functions.new_pid()
    Elixir.Core.Store.create(pid, fun.())
    { :ok, pid }
  end

  def start(fun, options) do
    pid = if Elixir.Keyword.has_key?(options, :name) do
      Elixir.Keyword.get(options, :name)
    else
      Elixir.Core.Functions.new_pid()
    end

    Elixir.Core.Store.create(pid, fun.())
    { :ok, pid }
  end

  def stop(agent) do
    Elixir.Core.Store.remove(agent)
    :ok
  end

  def update(agent, fun) do
    current_state = Elixir.Core.Store.read(agent)
    Elixir.Core.Store.update(agent, fun.(current_state))
    :ok
  end

  def get(agent, fun) do
    current_state = Elixir.Core.Store.read(agent)
    fun.(current_state)
  end

  def get_and_update(agent, fun) do
    current_state = Elixir.Core.Store.read(agent)
    {val, new_state} = fun.(current_state)
    Elixir.Core.Store.update(agent, new_state)
    val
  end

end
