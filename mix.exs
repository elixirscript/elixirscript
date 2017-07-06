defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.29.0-dev",
      elixir: "~> 1.5-dev",
      elixirc_paths: elixirc_paths(Mix.env),
      deps: deps(),
      description: description(),
      package: package(),
      source_url: "https://github.com/elixirscript/elixirscript",
      aliases: aliases(),
      test_coverage: [tool: ExCoveralls],
      docs: [
        extras: ["GettingStarted.md", "JavaScriptInterop.md"]
      ]
    ]
  end

  def application do
    [
      applications: [:logger, :estree]
    ]
  end

  defp deps do
    [
      {:estree, "~> 2.6"},
      {:fs, "~> 3.4"},
      {:ex_doc, "~> 0.16", only: :dev},
      {:excoveralls, "~> 0.7", only: :test},
      {:credo, "~> 0.8", only: [:dev, :test]},
      {:poison, "~> 3.1", only: [:dev, :test]}
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_),     do: ["lib"]

  defp description do
    """
    ElixirScript: compiles Elixir code to JavaScript
    """
  end

  defp package do
    [
      files: ["lib", "priv/**/*.*", "mix.exs", "README.md", "LICENSE", "CHANGELOG.md"],
      maintainers: ["Bryan Joseph"],
      licenses: ["MIT"],
      links: %{
        "GitHub" => "https://github.com/elixirscript/elixirscript"
      },
      build_tools: ["mix"]
    ]
  end

  defp aliases do
    [build_js: &build_js/1]
  end

  def build_js(_) do
    Mix.Task.run "app.start"
    System.cmd("yarn", ["build"])
  end

end
