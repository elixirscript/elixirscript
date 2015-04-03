defmodule ExToJS.Mixfile do
  use Mix.Project

  def project do
    [app: :ex_to_js,
     version: "0.1.0",
     elixir: "~> 1.0",
     compilers: Mix.compilers,
     escript: escript_config,
     deps: deps,
     description: description,
     package: package,
     source_url: "https://github.com/bryanjos/ex_to_js"]
  end

  def application do
    [applications: [:logger, :poison]]
  end

  defp deps do
    [
      { :poison, "~> 1.3" },
      { :estree, github: "bryanjos/elixir-estree"}
    ]
  end

  defp escript_config do
    [main_module: ExToJS.CLI, name: "ex2js", path: "priv/ex2js"]
  end

  defp description do
    """
    An experiment in converting Elixir to JavaScript
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
