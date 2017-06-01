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
        elixir_script: [ input: Example, output: "dest/js"],
        compilers: Mix.compilers ++ [:elixir_script]
      ]
    end
  """

  def run(_) do
    Mix.Task.run "app.start"

    {input, opts} = Mix.Tasks.Compile.ElixirScript.get_compiler_params() 

    {:ok, _} = ElixirScript.Watcher.start_link(
      input, 
      opts
    )

    :timer.sleep :infinity
  end

end
