defmodule Mix.Tasks.Elixirscript.Watch do
  use Mix.Task

  @shortdoc "Watches ElixirScript files for changes"

  def run(_) do
    Mix.Task.run "app.start"

    elixirscript_config = get_elixirscript_config()
    input_path = Keyword.fetch!(elixirscript_config, :input)
    output_path = Keyword.fetch!(elixirscript_config, :output)
    {:ok, pid} = ElixirScript.Watcher.start_link(input_path, %{ output: output_path })

    :timer.sleep :infinity
  end

  defp get_elixirscript_config() do
    config  = Mix.Project.config
    Keyword.fetch!(config, :elixir_script)
  end

end
