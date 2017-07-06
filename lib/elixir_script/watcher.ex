defmodule ElixirScript.Watcher do
  use GenServer
  require Logger

  @moduledoc """
  Watches the input folder for changes and calls the ElixirScript compiler
  """


  def start_link(input, options) do
    GenServer.start_link(__MODULE__, [input: input, options: options])
  end

  def init(args) do
    {:ok, _} = Application.ensure_all_started(:elixir_script)
    {:ok, _} = Application.ensure_all_started(:fs)

    :fs.subscribe()
    {:ok, args}
  end

  def handle_info({_pid, {:fs, :file_event}, {path, event}}, state) do

    try do
      if input_changed?(to_string(path)) do
        Logger.debug fn() ->
          "Event: #{inspect event} Path: #{path}"
        end
        ElixirScript.Compiler.compile(state[:input], state[:options])
      end
    rescue
      x ->
        Logger.error(x.message)
    end

    {:noreply, state}
  end

  defp input_changed?(path) do
    case Path.extname(path) do
      ".beam" ->
        true
      _ ->
        false
    end
  end
end
