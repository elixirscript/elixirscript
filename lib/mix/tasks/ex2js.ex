defmodule Mix.Tasks.Ex2js do
  use Mix.Task
  
   @shortdoc "Translate Elixir code to javascript"

  def run(args) do
    args
    |> ExToJS.CLI.parse_args
    |> ExToJS.CLI.process
  end
end