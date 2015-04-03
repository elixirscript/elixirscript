defmodule ExToJS.CLI do
  def main(argv) do
    argv
    |> parse_args
    |> process
  end

  def parse_args(args) do
    switches = [ output: :binary, ast: :boolean, elixir: :boolean, stdio: :boolean, lib: :boolean]
    aliases = [ o: :output, t: :ast, ex: :elixir, st: :stdio ]
    
    parse = OptionParser.parse(args, switches: switches, aliases: aliases)

    case parse do
      { [stdio: true] , _ , _ } -> {:stdio}
      { [lib: true] , _ , _ } -> {:lib}
      { [ output: output, ast: true, elixir: true], [input], _ } -> { input, output, :ast, :elixir}
      { [ output: output, ast: true], [input], _ } -> { input, output, :ast }
      { [ast: true, elixir: true] , [input], _ } -> { input, :ast, :elixir }
      { [ ast: true ] , [input], _ } -> { input, :ast }

      { [ output: output, elixir: true], [input], _ } -> { input, output, :elixir}
      { [ output: output], [input], _ } -> { input, output }

      { [elixir: true] , [input], _ } -> { input, :elixir }
      { [] , [input], _ } -> { input }
      _ -> :help
    end

  end

  def process({ input, output, :ast, :elixir }) do
    input 
    |> ExToJS.parse_elixir 
    |> ExToJS.write_to_files(output)
  end

  def process({ input, output, :ast }) do
    input 
    |> ExToJS.parse_elixir_files 
    |> ExToJS.write_to_files(output)
  end

  def process({ input, :ast }) do
    input 
    |> ExToJS.parse_elixir_files 
    |> Enum.map(fn({_path, ast})-> 
      ast
      |> Poison.encode!
      |> IO.write
    end)
  end

  def process({ input, :ast, :elixir }) do
    {_path, ast} = input 
    |> ExToJS.parse_elixir

    ast
    |> Poison.encode!
    |> IO.write   
  end

  def process({ input, :elixir }) do
    {_path, js} = input 
    |> ExToJS.parse_elixir
    |> ExToJS.javascript_ast_to_code 

    IO.write(js)
  end

  def process({ input, output, :elixir }) do
    input 
    |> ExToJS.parse_elixir
    |> ExToJS.write_to_files(output)
  end

  def process({ input, output }) do
    input 
    |> ExToJS.parse_elixir_files 
    |> ExToJS.javascript_ast_to_code 
    |> ExToJS.write_to_files(output)
  end

  def process({ :stdio }) do
    Enum.each(IO.stream(:stdio, 5000), fn(x) ->
      process({x, :elixir})
    end)
  end

  def process({ :lib }) do
    path = ExToJS.operating_path

    file = File.read!("#{path}/elixir.js")
    IO.write(file)
  end

  def process({ input }) do
    input 
    |> ExToJS.parse_elixir_files 
    |> ExToJS.javascript_ast_to_code 
    |> Enum.map(fn({_path, code})-> 
      IO.write(code)
    end)
  end

  def process(:help) do
    IO.write """
      usage: ex2js <input> [options]

      <input> path to elixir files or 
              the elixir code string if the -ex flag is used

      options:

      -o  --output [path]   places output at the given path
      -t  --ast             shows only produced spider monkey ast
      -ex --elixir          read input as elixir code string
      -st --stdio           reads from stdio
          --lib             writes the standard lib js to standard out
      -h  --help            this message
    """
  end
end