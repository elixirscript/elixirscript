defmodule ElixirScript.Watcher do
  use GenServer
  require Logger

  def start_link(input, options) do
    GenServer.start_link(__MODULE__, [input: input, options: options])
  end

  def init(args) do
    {:ok, _} = Application.ensure_all_started(:elixir_script)
    :fs.subscribe()
    {:ok, args}
  end

  def handle_info({_pid, {:fs, :file_event}, {path, event}}, state) do
    Logger.debug "File changed: #{path}"
    ElixirScript.compile_path(state[:input], state[:options])
    {:noreply, state}
  end
end
