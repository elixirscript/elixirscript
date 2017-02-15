defmodule Mix.Tasks.Compile.ElixirScript do
  use Mix.Task

  @moduledoc """
  Mix compiler to allow mix to compile Elixirscript source files into JavaScript

  Looks for an `elixir_script` key in your mix project config

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
    elixirscript_config = get_elixirscript_config()

    elixirscript_base = Path.join([Mix.Project.build_path, "elixirscript"])
    File.mkdir_p!(elixirscript_base)
    elixirscript_path = Path.join([elixirscript_base, "#{Mix.Project.config[:app]}"])

    input_path = Keyword.fetch!(elixirscript_config, :input)
    |> List.wrap
    |> Enum.map(fn(path) -> 
      Path.absname(path)
    end)
    |> Enum.join("\n")

    File.write!(elixirscript_path, input_path)

    paths = Path.join([elixirscript_base, "*"]) 
    |> Path.wildcard
    |> Enum.map(fn(path) ->
      {Path.basename(path), File.read!(path)}
    end)
    |> Map.new

    output_path = Keyword.fetch!(elixirscript_config, :output)
    ElixirScript.compile_path(paths, %{output: output_path})
    :ok
  end

  def clean do
    elixirscript_config = get_elixirscript_config()
    output_path = Keyword.fetch!(elixirscript_config, :output)

    File.ls!(output_path)
    |> Enum.each(fn(x) ->
      if String.contains?(Path.basename(x), "Elixir.") do
        File.rm!(Path.join(output_path, x))
      end
    end)

    :ok
  end

  defp get_elixirscript_config() do
    config  = Mix.Project.config
    Keyword.fetch!(config, :elixir_script) || Keyword.fetch!(config, :elixirscript)
  end

end
