defmodule Mix.Tasks.Elixirscript do
  @moduledoc """
  Translate Elixir code to javascript

      usage: mix elixirscript <input> [options]
      <input> path to elixir files or the elixir code string if the -ex flag is used
      options:
      -o  --output [path]   places output at the given path
      -ex --elixir          read input as elixir code string
      -r  --root [path]     root import path for all exported modules
      --std_lib [path]      outputs the elixirscript standard library JavaScript files to the specified path
      --full_build          informs the compiler to do a full build instead of an incremental one
      only used when output is specified
      --core_path    es6 import path to the elixirscript standard lib
      only used with the [output] option. When used, elixir.js is not exported
      -h  --help            this message
  """

  use Mix.Task

   @shortdoc "Translate Elixir to JavaScript"

  def run(args) do
    Mix.Task.run "app.start"

    args
    |> ElixirScript.CLI.parse_args
    |> ElixirScript.CLI.process
  end
end
