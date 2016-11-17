defmodule ElixirScript.Process do
  @moduledoc false
  def alive?(pid) do
    Elixir.Core.processes.is_alive(pid)
  end

  def delete(key) do
    Elixir.Core.processes.erase(key)
  end

  def exit(pid, reason) do
    Elixir.Core.processes.exit(pid, reason)
  end

  def flag(flag, value) do
    Elixir.Core.processes.process_flag(flag, value)
  end

  def flag(pid, flag, value) do
    Elixir.Core.processes.process_flag(pid, flag, value)
  end

  def get() do
    Elixir.Core.processes.get_process_dict()
  end

  def get(key, default \\ nil) do
    Elixir.Core.processes.get(key, default)
  end

  def get_keys() do
    Elixir.Core.processes.get_keys()
  end

  def get_keys(value) do
    Elixir.Core.processes.get_keys(value)
  end

  def put(key, value) do
    Elixir.Core.processes.put(key, value)
  end

  def link(pid) do
    Elixir.Core.processes.link(pid)
  end

  def unlink(pid) do
    Elixir.Core.processes.unlink(pid)
  end

  def monitor(item) do
    Elixir.Core.processes.monitor(item)
  end

  def demonitor(monitor_ref) do
    Elixir.Core.processes.demonitor(monitor_ref)
  end

  def register(pid, name) when is_atom(name) do
    Elixir.Core.processes.register(name, pid)
  end

  def registered() do
    Elixir.Core.processes.registered()
  end

  def whereis(name) do
    Elixir.Core.processes.whereis(name)
  end

  def unregister(name) do
    Elixir.Core.processes.unregister(name)
  end

  def list() do
    Elixir.Core.processes.list()
  end

  def sleep(duration) when is_integer(duration) do
    Elixir.Core.processes.sleep(duration)
  end

  def sleep(:infinity) do
    Elixir.Core.processes.sleep(:infinity)
  end

  def send(dest, msg, _) do
    Elixir.Core.processes.send(dest, msg)
  end
end
