defmodule Mix.Tasks.Ex2js.Dist do
  @moduledoc false

  use Mix.Task
  
   @shortdoc "Builds a release for ex2js"
   @dist_folder "dist"
   @folder_name "#{@dist_folder}/ex2js"
   @archive_file_name "#{@dist_folder}/ex2js.tar.gz"

  def run(_args) do
    Mix.Task.run "app.start"
    Mix.Tasks.Escript.Build.run([])

    if File.exists?(@dist_folder) do
      File.rm_rf(@dist_folder)
    end

    build_standard_library
    copy_artifacts
    build_tarball

    File.rm_rf(@folder_name)
  end

  defp build_standard_library() do
    System.cmd("gulp", ["dist"])
  end

  defp copy_artifacts() do
    File.mkdir_p(@folder_name <> "/bin")
    File.cp!("ex2js", "#{@folder_name}/bin/ex2js")
    File.cp_r!("priv/javascript/dist", "#{@folder_name}/lib")
  end

  defp build_tarball() do
    System.cmd("tar", ["czf", @archive_file_name, @folder_name])
  end
end
