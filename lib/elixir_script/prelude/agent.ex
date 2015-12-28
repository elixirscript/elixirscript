defmodule ElixirScript.Agent do

  def start(fun) do
    pid = Elixir.Core.Functions.get_global().processes.spawn()
    Elixir.Core.Functions.get_global().processes.put(pid, "state", fun.());
    { :ok, pid }
  end

  def start(fun, options) do
    pid = Elixir.Core.Functions.get_global().processes.spawn()

    if Elixir.Keyword.has_key?(options, :name) do
      pid = Elixir.Core.Functions.get_global().processes.register(Elixir.Keyword.get(options, :name), pid)
    end

    Elixir.Core.Functions.get_global().processes.put(pid, "state", fun.())
    { :ok, pid }
  end

  def stop(view) do
    Elixir.Core.Functions.get_global().processes.exit(view)
    :ok
  end

  def update(agent, fun) do
    current_state = Elixir.Core.Functions.get_global().processes.get(agent, "state")
    Elixir.Core.Functions.get_global().processes.put(agent, "state", fun.(current_state));
    :ok
  end

  def get(agent, fun) do
    current_state = Elixir.Core.Functions.get_global().processes.get(agent, "state")
    fun.(current_state)
  end

  def get_and_update(agent, fun) do
    current_state = Elixir.Core.Functions.get_global().processes.get(agent, "state")
    {val, new_state} = fun.(current_state)
    Elixir.Core.Functions.get_global().processes.put(agent, "state", new_state);
    val
  end

end
