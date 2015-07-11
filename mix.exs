defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.7.0-dev",
      elixir: "~> 1.0",
      compilers: Mix.compilers,
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
      { :estree, github: "bryanjos/elixir-estree"},
      { :shouldi, only: :test}
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
    [ # These are the default files included in the package
      files: ["lib", "mix.exs", "README*", "readme*", "LICENSE*", "license*", "CHANGELOG*"],
      contributors: ["Bryan Joseph"],
      licenses: ["MIT"],
      links: %{ 
        "GitHub" => "https://github.com/bryanjos/elixirscript"
      }
    ]
  end
  
end
