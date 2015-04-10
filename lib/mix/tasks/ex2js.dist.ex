defmodule Mix.Tasks.Ex2js.Dist do
  use Mix.Task
  
   @shortdoc "Builds a release for ex2js"

  def run(args) do
    Mix.Task.run "app.start"

    dist_folder = "dist"
    folder_name = "#{dist_folder}/ex2js"

    version = Mix.Project.config[:version]
    archive_file_name = "#{dist_folder}/ex2js.tar.gz"

    if File.exists?(dist_folder) do
      File.rm_rf(dist_folder)
    end

    Mix.Tasks.Escript.Build.run([])

    File.mkdir_p(folder_name <> "/bin")
    File.cp!("priv/ex2js", "#{folder_name}/bin/ex2js")
    File.cp!("priv/alphonse/alphonse.js", "#{folder_name}/alphonse.js")
    File.cp_r!("node_modules", "#{folder_name}/node_modules")
    File.cp!("package.json", "#{folder_name}/package.json")

    System.cmd("gulp", ["dist"])

    File.cp!("priv/alphonse/dist/elixir.js", "#{folder_name}/elixir.js")

    System.cmd("tar", ["czf", archive_file_name, folder_name])

    File.rm_rf(folder_name)
  end
end