defmodule Mix.Tasks.Ex2js.Install do
  use Mix.Task
  
   @shortdoc "Installs ex2js from the dist folder to /usr/local/ex2js"

  def run(args) do
    Mix.Task.run "app.start"

    System.cmd("tar", ["-zxvf", "dist/ex2js.tar.gz"])

    File.rm_rf!("/usr/local/ex2js")

    System.cmd("mv", ["dist/ex2js", "/usr/local/ex2js"])

    IO.puts("installed at /usr/local/ex2js")
  end
end