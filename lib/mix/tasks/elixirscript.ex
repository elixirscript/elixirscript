defmodule Mix.Tasks.Elixirscript do
  use Mix.Task

  @shortdoc "Translate Elixir to JavaScript"


  def run(args) do
    Mix.Task.run "app.start"

    args
    |> ElixirScript.CLI.parse_args
    |> ElixirScript.CLI.process
  end
end
