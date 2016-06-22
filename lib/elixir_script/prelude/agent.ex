defmodule ElixirScript.Agent do

  def start(fun) do
    pid = Elixir.Core.processes.spawn(fn() -> end)
    Elixir.Core.processes.put(pid, "state", fun.());
    { :ok, pid }
  end

  def start(fun, options) do
    pid = Elixir.Core.processes.spawn(fn() ->
    end)

    pid = if Elixir.Keyword.has_key?(options, :name) do
      Elixir.Core.processes.register(Elixir.Keyword.get(options, :name), pid)
    else
      pid
    end

    Elixir.Core.processes.put(pid, "state", fun.())
    { :ok, pid }
  end

  def stop(agent) do
    Elixir.Core.processes.exit(agent)
    :ok
  end

  def update(agent, fun) do
    current_state = Elixir.Core.processes.get(agent, "state")
    Elixir.Core.processes.put(agent, "state", fun.(current_state));
    :ok
  end

  def get(agent, fun) do
    current_state = JS.global().processes.get(agent, "state")
    fun.(current_state)
  end

  def get_and_update(agent, fun) do
    current_state = Elixir.Core.processes.get(agent, "state")
    {val, new_state} = fun.(current_state)
    Elixir.Core.processes.put(agent, "state", new_state);
    val
  end

end
