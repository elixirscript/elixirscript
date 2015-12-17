defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.15.0-dev",
      elixir: "~> 1.0",
      escript: escript_config,
      deps: deps,
      description: description,
      package: package,
      source_url: "https://github.com/bryanjos/elixirscript",
      aliases: aliases,
      test_coverage: [tool: ExCoveralls],
      preferred_cli_env: [coveralls: :test],
      docs: [
        extras: ["GettingStarted.md", "FAQ.md"]
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
      {:estree, "~> 2.0"},
      {:shouldi, only: :test },
      {:earmark, "~> 0.1", only: :dev },
      {:ex_doc, "~> 0.10", only: :dev },
      {:benchfella, "~> 0.2", only: :test},
      {:excoveralls, "~> 0.4", only: :test},
      {:credo, "~> 0.2.0", only: [:dev, :test]}
    ]
  end

  defp escript_config do
    [main_module: ElixirScript.CLI, name: "elixirscript"]
  end

  defp description do
    """
    ElixirScript: compiles Elixir code to JavaScript
    """
  end

  defp package do
    [
      files: ["lib", "priv/Elixir.js", "mix.exs", "README*", "readme*", "LICENSE*", "license*", "CHANGELOG*"],
      maintainers: ["Bryan Joseph"],
      licenses: ["MIT"],
      links: %{
        "GitHub" => "https://github.com/bryanjos/elixirscript"
      },
      build_tools: ["mix"]
    ]
  end

  defp aliases do
    [dist: &dist/1,
     install: &install/1]
  end

  def dist(_) do
    Mix.Task.run "app.start"

    dist_folder = "dist"
    folder_name = "#{dist_folder}/elixirscript"
    archive_file_name = "#{dist_folder}/elixirscript.tar.gz"

    Mix.Tasks.Escript.Build.run([])

    if File.exists?(dist_folder) do
      File.rm_rf(dist_folder)
    end

    { _ , _ } = System.cmd("node", ["node_modules/gulp/bin/gulp.js", "dist_build"])
    { elixir_js, _ } = System.cmd("node", ["node_modules/rollup/bin/rollup", "./src/javascript/dist_build/Elixir.js"])
    File.write!("priv/Elixir.js", elixir_js)
    { _ , _ } = System.cmd("node", ["node_modules/gulp/bin/gulp.js", "dist_add_source_map"])

    File.mkdir_p(folder_name <> "/bin")
    File.cp!("elixirscript", "#{folder_name}/bin/elixirscript")
    File.cp!("priv/Elixir.js", "#{folder_name}/Elixir.js")
    File.cp!("LICENSE", "#{folder_name}/LICENSE")

    System.cmd("tar", ["czf", archive_file_name, folder_name])

    File.rm_rf(folder_name)
  end

  def install(_) do
    Mix.Task.run "app.start"

    System.cmd("tar", ["-zxvf", "dist/elixirscript.tar.gz"])

    File.rm_rf!("/usr/local/elixirscript")

    System.cmd("mv", ["dist/elixirscript", "/usr/local/elixirscript"])

    IO.puts("installed at /usr/local/elixirscript")
  end

end
