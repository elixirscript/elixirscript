defmodule Mix.Tasks.Compile.Npm do
  use Mix.Task

  def run(_args) do
    if !File.exists?("node_modules/escodegen") do
      System.cmd "npm", ["install"]
    end
  end
end
