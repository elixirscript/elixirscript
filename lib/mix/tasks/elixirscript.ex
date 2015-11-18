defmodule Mix.Tasks.Elixirscript do
  @moduledoc """
  Translate Elixir code to javascript

      usage: mix elixirscript <input> [options]
      <input> path to elixir files or the elixir code string if the -ex flag is used
      options:
      -o  --output [path]   places output at the given path
      -ex --elixir          read input as elixir code string
      -r  --root [path]     root path for standard libs
      -h  --help            this message
  """

  use Mix.Task

   @shortdoc "Translate Elixir code to javascript"

  def run(args) do
    Mix.Task.run "app.start"

    args
    |> ElixirScript.CLI.parse_args
    |> ElixirScript.CLI.process
  end
end
