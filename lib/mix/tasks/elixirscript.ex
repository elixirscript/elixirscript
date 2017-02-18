defmodule Mix.Tasks.Elixirscript do
  @moduledoc """
  A command-line interface to the elixirscript compiler
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
