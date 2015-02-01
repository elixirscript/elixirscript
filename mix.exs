defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [app: :elixir_script,
     version: "0.0.1",
     elixir: "~> 1.0",
     escript: escript_config,
     deps: deps]
  end

  def application do
    [applications: [:logger, :poison, :inflex]]
  end

  defp deps do
    [
      { :poison, "~> 1.3" },
      { :inflex, "~> 0.2.5" }
    ]
  end

  defp escript_config do
    [main_module: ElixirScript.CLI, name: "exjs"]
  end
  
end
