defmodule Mix.Tasks.Elixirscript.Watch do
  use Mix.Task

  @shortdoc "Watches ElixirScript files for changes"

  @moduledoc """
  Watches ElixirScript files for changes

  Looks for the `elixir_script` key in your mix project config

  def project do
  [
  app: :my_app,
  version: "0.1.0",
  elixir: "~> 1.0",
  deps: deps,
  elixir_script: [ input: "src/exjs", output: "dest/js"],
  compilers: [:elixir_script] ++ Mix.compilers
  ]
  end
  """



  def run(_) do
    Mix.Task.run "app.start"

    elixirscript_config = get_elixirscript_config()
    input_path = Keyword.fetch!(elixirscript_config, :input)
    output_path = Keyword.fetch!(elixirscript_config, :output)
    {:ok, _} = ElixirScript.Watcher.start_link(input_path, %{ output: output_path })

    :timer.sleep :infinity
  end

  defp get_elixirscript_config() do
    config  = Mix.Project.config
    Keyword.fetch!(config, :elixir_script)
  end

end
