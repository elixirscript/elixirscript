defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.32.0-dev",
      elixir: "~> 1.6-rc",
      elixirc_paths: elixirc_paths(Mix.env),
      deps: deps(),
      description: description(),
      package: package(),
      source_url: "https://github.com/elixirscript/elixirscript",
      test_coverage: [tool: ExCoveralls],
      docs: [
        main: "ElixirScript",
        extras: ["JavaScriptInterop.md"]
      ]
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      {:estree, "~> 2.6"},
      {:ex_doc, "~> 0.16", only: :dev},
      {:excoveralls, "~> 0.7", only: :test},
      {:credo, "~> 0.8", only: [:dev, :test]},
      {:stream_data, "~> 0.3", only: :test},
      {:poison, "~> 3.1", only: :test}
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

end
