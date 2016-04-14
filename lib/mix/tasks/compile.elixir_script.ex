defmodule Mix.Tasks.Compile.ElixirScript do
  use Mix.Task

  @moduledoc """
  Compiles Elixirscript source files into JavaScript

  Looks for an `elixirscript` key in your mix project config

      def project do
      [
        app: :my_app,
        version: "0.1.0",
        elixir: "~> 1.0",
        deps: deps,
        elixir_script: [ input: "src/exjs", output: "src/js"],
        compilers: [:elixir_script] ++ Mix.compilers
      ]
      end
  """


  def run(_) do
    elixirscript_config = get_elixirscript_config()
    input_path = Keyword.fetch!(elixirscript_config, :input)
    output_path = Keyword.fetch!(elixirscript_config, :output)

    ElixirScript.compile_path(input_path, %{ output: output_path })
    :ok
  end

  def clean do
    elixirscript_config = get_elixirscript_config()
    input_path = Keyword.fetch!(elixirscript_config, :input)
    output_path = Keyword.fetch!(elixirscript_config, :output)

    File.ls!(output_path)
    |> Enum.each(fn(x) ->
      if String.contains?(Path.basename(x), "Elixir.") do
        File.rm!(Path.join(output_path, x))
      end
    end)

    :ok
  end

  def get_elixirscript_config() do
    config  = Mix.Project.config
    Keyword.fetch!(config, :elixir_script)
  end

end
