defmodule Mix.Tasks.Compile.Ex2js do
  use Mix.Task

  def run(_args) do
    if !File.exists?("node_modules/escodegen") do
      System.cmd "npm", ["install"]
    end

    if !File.exists?("priv/ex2js") do
      Mix.Tasks.Escript.Build.run(["--no-compile"])
    end
  end
end
