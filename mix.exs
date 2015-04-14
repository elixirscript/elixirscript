defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.2.1",
      elixir: "~> 1.0",
      compilers: Mix.compilers,
      escript: escript_config,
      deps: deps,
      description: description,
      package: package,
      source_url: "https://github.com/bryanjos/ex_to_js"
    ]
  end

  def application do
    [applications: [:logger, :poison]]
  end

  defp deps do
    [
      { :poison, "~> 1.3" },
      { :estree, "~> 1.0.1"}
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
      files: ["lib", "mix.exs", "README*", "readme*", "LICENSE*", "license*", "CHANGELOG*", "escodegen"],
      contributors: ["Bryan Joseph"],
      licenses: ["MIT"],
      links: %{ 
        "GitHub" => "https://github.com/bryanjos/ex_to_js"
      }
    ]
  end
  
end
