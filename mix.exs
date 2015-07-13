defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.6.5",
      elixir: "~> 1.0",
      escript: escript_config,
      deps: deps,
      description: description,
      package: package,
      source_url: "https://github.com/bryanjos/elixirscript"
    ]
  end

  def application do
    [
      applications: [:logger]
    ]
  end

  defp deps do
    [
      { :inflex, "~> 1.0" },
      { :estree, "~> 2.0" },
      { :shouldi, only: :test },
      { :earmark, "~> 0.1", only: :dev },
      { :ex_doc, "~> 0.7", only: :dev }
    ]
  end

  defp escript_config do
    [main_module: ElixirScript.CLI, name: "ex2js"]
  end

  defp description do
    """
    converts Elixir to JavaScript
    """
  end

  defp package do
    [
      files: ["lib", "priv/javascript/lib", "mix.exs", "README*", "readme*", "LICENSE*", "license*", "CHANGELOG*"],
      contributors: ["Bryan Joseph"],
      licenses: ["MIT"],
      links: %{ 
        "GitHub" => "https://github.com/bryanjos/elixirscript"
      },
      build_tools: ["mix"]
    ]
  end
  
end
