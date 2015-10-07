defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.12.0",
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
        extras: ["README.md"]
      ]
    ]
  end

  def application do
    [
      applications: [:logger, :inflex, :estree]
    ]
  end

  defp deps do
    [
      {:inflex, "~> 1.4" },
      {:estree, "~> 2.0"},
      {:shouldi, only: :test },
      {:earmark, "~> 0.1", only: :dev },
      {:ex_doc, "~> 0.10", only: :dev },
      {:benchfella, "~> 0.2", only: :test},
      {:excoveralls, "~> 0.3", only: :test}  
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
      files: ["lib", "priv/javascript/dist", "mix.exs", "README*", "readme*", "LICENSE*", "license*", "CHANGELOG*"],
      contributors: ["Bryan Joseph"],
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
    folder_name = "#{dist_folder}/ex2js"
    archive_file_name = "#{dist_folder}/ex2js.tar.gz"

    File.mkdir_p("priv/javascript/dist")

    Mix.Tasks.Escript.Build.run([])

    if File.exists?(dist_folder) do
      File.rm_rf(dist_folder)
    end

    { _ , _ } = System.cmd("node", ["node_modules/gulp/bin/gulp.js", "dist_build"])
    { elixir_js, _ } = System.cmd("node", ["node_modules/rollup/bin/rollup", "./priv/javascript/dist_build/elixir.js"])
    File.write!("priv/javascript/dist/elixir.js", elixir_js)
    { _ , _ } = System.cmd("node", ["node_modules/gulp/bin/gulp.js", "dist_add_source_map"])

    File.mkdir_p(folder_name <> "/bin")
    File.cp!("ex2js", "#{folder_name}/bin/ex2js")
    File.cp_r!("priv/javascript/dist", "#{folder_name}/dist")
    File.cp_r!("LICENSE", "#{folder_name}/LICENSE")

    System.cmd("tar", ["czf", archive_file_name, folder_name])

    File.rm_rf(folder_name)
  end

  def install(_) do
    Mix.Task.run "app.start"

    System.cmd("tar", ["-zxvf", "dist/ex2js.tar.gz"])

    File.rm_rf!("/usr/local/ex2js")

    System.cmd("mv", ["dist/ex2js", "/usr/local/ex2js"])

    IO.puts("installed at /usr/local/ex2js")
  end
  
end
