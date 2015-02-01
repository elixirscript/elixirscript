defmodule ElixirScript.CLI do
  def main(argv) do
    argv
    |> parse_args
  end

  defp parse_args([input_dir, output_dir]) do
    input_dir
    |> ElixirScript.parse_ex_files
    |> ElixirScript.write_js_files
  end

  defp parse_args(_) do
    IO.puts("help")
  end
end