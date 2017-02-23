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
    input_path = Keyword.get(elixirscript_config, :input)
    output_path = Keyword.get(elixirscript_config, :output)
    format = Keyword.get(elixirscript_config, :format)
    js_modules = Keyword.get(elixirscript_config, :js_modules, [])       

    {:ok, _} = ElixirScript.Watcher.start_link(
      input_path, 
      %{output: output_path, format: format, js_modules: js_modules}
    )

    :timer.sleep :infinity
  end

  defp get_elixirscript_config() do
    config  = Mix.Project.config
    exjs_config = cond do
      Keyword.has_key?(config, :elixir_script) ->
        Keyword.get(config, :elixir_script, [])
      Keyword.has_key?(config, :elixirscript) ->
        Keyword.get(config, :elixirscript, [])
      true ->
        defaults()
    end

    Keyword.merge(defaults(), exjs_config)
  end

  defp defaults() do
    [
      input: "lib/elixirscript",
      output: "priv/elixirscript",
      format: :es
    ]
  end

end
