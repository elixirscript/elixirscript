defmodule ExToJS.CLI do
  def main(argv) do
    argv
    |> parse_args
    |> process
  end

  defp parse_args(args) do
    switches = [ output: :binary, ast: :boolean, elixir: :boolean ]
    aliases = [ o: :output, a: :ast, ex: :elixir ]
    
    parse = OptionParser.parse(args, switches: switches, aliases: aliases)

    case parse do
      { [ output: output, ast: true, elixir: true], [input], _ } -> { input, output, :ast, :elixir}
      { [ output: output, ast: true], [input], _ } -> { input, output, :ast }
      { [ ast: true ] , [input], _ } -> { input, :ast }

      { [ output: output, elixir: true], [input], _ } -> { input, output, :elixir}
      { [ output: output], [input], _ } -> { input, output }

      { [elixir: true] , [input], _ } -> { input, :elixir }
      { [] , [input], _ } -> { input }
      _ -> :help
    end

  end

  defp process({ input, output, :ast, :elixir }) do
    input 
    |> ExToJS.parse_elixir 
    |> ExToJS.write_to_file(output)
  end

  defp process({ input, output, :ast }) do
    input 
    |> ExToJS.parse_ex_files 
    |> ExToJS.write_to_files(output)
  end

  defp process({ input, :ast }) do
    input 
    |> ExToJS.parse_ex_files 
    |> Enum.map(fn({ast, _path})-> IO.puts(ast) end)
  end

  defp process({ input, output, :elixir }) do
    input 
    |> ExToJS.parse_elixir
    |> ExToJS.write_to_files(output)
  end

  defp process({ input, :elixir }) do
    input 
    |> ExToJS.parse_elixir
    |> Enum.map(fn({js, _path})-> IO.puts(js) end)
  end

  defp process({ input, output }) do
    input 
    |> ExToJS.parse_ex_files 
    |> ExToJS.convert_ast_to_js 
    |> ExToJS.write_to_files(output)
  end

  defp process({ input }) do
    input 
    |> ExToJS.parse_ex_files 
    |> ExToJS.convert_ast_to_js 
    |> Enum.map(fn({js, _path})-> IO.puts(js) end)
  end

  defp process(:help) do
    IO.puts """
      usage: ex2js <input> [options]

      options:

      -o  --output   places output in the given directory or file
      -a  --ast      shows only produced spider monkey ast
      -ex --elixir  read input as elixir code string
    """
  end
end