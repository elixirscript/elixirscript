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

    try do
      if input_changed?(to_string(path), state) do
        Logger.debug "Event: #{inspect event} Path: #{path}"
        ElixirScript.compile_path(state[:input], state[:options])
      end
    rescue
      x ->
        Logger.error(x.message)
    end

    {:noreply, state}
  end

  defp input_changed?(path, state) do
    file = Path.basename(path)

    case file do
      "." <> _ ->
        false
      _ ->
       path == Path.absname(Path.join([state[:input], file]))
    end
  end
end
