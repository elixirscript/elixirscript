defmodule Mix.Tasks.Ex2js.Prof do
  use Mix.Task
  import ExProf.Macro
  
  @shortdoc "Profiles ElixirScript"

  def run(args) do
    Mix.Task.run "app.start"

    records = do_analyze
    total_percent = Enum.reduce(records, 0.0, &(&1.percent + &2))
    IO.inspect "total = #{total_percent}"
  end

  defp do_analyze do
    profile do
      ElixirScript.CLI.main(["/Users/bryanjos/projects/basstype/color_bar_spike/src/exjs/**/*.exjs", "-o", "sample/dest"])
    end
  end
end