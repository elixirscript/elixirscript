defmodule ElixirScript.Agent do

  def start(fun) do
    pid = JS.global().processes.spawn()
    JS.global().processes.put(pid, "state", fun.());
    { :ok, pid }
  end

  def start(fun, options) do
    pid = JS.global().processes.spawn()

    if Elixir.Keyword.has_key?(options, :name) do
      pid = JS.global().processes.register(Elixir.Keyword.get(options, :name), pid)
    end

    JS.global().processes.put(pid, "state", fun.())
    { :ok, pid }
  end

  def stop(view) do
    JS.global().processes.exit(view)
    :ok
  end

  def update(agent, fun) do
    current_state = JS.global().processes.get(agent, "state")
    JS.global().processes.put(agent, "state", fun.(current_state));
    :ok
  end

  def get(agent, fun) do
    current_state = JS.global().processes.get(agent, "state")
    fun.(current_state)
  end

  def get_and_update(agent, fun) do
    current_state = JS.global().processes.get(agent, "state")
    {val, new_state} = fun.(current_state)
    JS.global().processes.put(agent, "state", new_state);
    val
  end

end
