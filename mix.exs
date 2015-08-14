defmodule ElixirScript.Mixfile do
  use Mix.Project

  def project do
    [
      app: :elixir_script,
      version: "0.8.0-dev",
      elixir: "~> 1.0",
      escript: escript_config,
      deps: deps,
      description: description,
      package: package,
      source_url: "https://github.com/bryanjos/elixirscript",
      aliases: aliases
    ]
  end

  def application do
    [
      applications: [:logger]
    ]
  end

  defp deps do
    [
      { :inflex, "~> 1.4" },
      { :estree, github: "bryanjos/elixir-estree" },
      { :shouldi, only: :test },
      { :earmark, "~> 0.1", only: :dev },
      { :ex_doc, "~> 0.8", only: :dev }
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

  defp aliases do
    [dist: &dist/1,
     install: &install/1]
  end

  def dist(_) do
   dist_folder = "dist"
   folder_name = "#{dist_folder}/ex2js"
   archive_file_name = "#{dist_folder}/ex2js.tar.gz"

    Mix.Task.run "app.start"
    Mix.Tasks.Escript.Build.run([])

    if File.exists?(dist_folder) do
      File.rm_rf(dist_folder)
    end

    System.cmd("gulp", ["dist"])

    File.mkdir_p(folder_name <> "/bin")
    File.cp!("ex2js", "#{folder_name}/bin/ex2js")
    File.cp_r!("priv/javascript/dist", "#{folder_name}/lib")

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
