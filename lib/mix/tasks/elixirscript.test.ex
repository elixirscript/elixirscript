defmodule Mix.Tasks.Elixirscript.Test do
  @moduledoc """
  Runs ElixirScript Tests
  """
  use Mix.Task

  @shortdoc "Runs ElixirScript Tests"
  @preferred_cli_env :test

  def run(args) do
    Mix.Task.run "app.start"

    path = Path.join([default_test_path(), "**", "*_test.exs"])
    case ElixirScript.Test.start(path) do
      :error ->
        System.at_exit(fn _ -> exit({:shutdown, 1}) end)
      :ok ->
        :ok
    end
  end

  defp default_test_path do
    if File.dir?("test_elixir_script") do
      "test_elixir_script"
    else
      ""
    end
  end
end
