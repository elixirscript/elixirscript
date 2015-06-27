defmodule ElixirScript.CLI do
  def main(argv) do
    argv
    |> parse_args
    |> process
  end

  def parse_args(args) do
    switches = [ 
      output: :binary, ast: :boolean, elixir: :boolean, 
      lib: :boolean, config: :binary, help: :boolean,
      stdio: :boolean
    ]

    aliases = [ o: :output, t: :ast, ex: :elixir, c: :config, h: :help, l: :lib, st: :stdio ]
    
    parse = OptionParser.parse(args, switches: switches, aliases: aliases)

    case parse do
      { [lib: true] , _ , _ } -> :lib
      { [help: true] , _ , _ } -> :help

      { [{:stdio, true} | options] , [], _ } -> { :stdio, options }

      { options , [input], _ } -> { input, options }
    end

  end

  def process(:lib) do
    path = ElixirScript.operating_path

    file = File.read!("#{path}/elixir.js")
    IO.write(file)
  end

  def process(:help) do
    IO.write """
      usage: ex2js <input> [options]

      <input> path to elixir files or 
              the elixir code string if the -ex flag is used

      options:

      -ex --elixir          read input as elixir code string

      -o  --output [path]   places output at the given path
      -t  --ast             shows only produced spider monkey ast
      -c  --config [path]   path to exjs.exs configuration file (defaults to exjs.exs)

      -l  --lib             writes the standard lib js to standard out
      -h  --help            this message
    """
  end

  def process({ :stdio, options }) do
    case options[:config] do
      nil ->
        ElixirScript.load_config()
      path ->
        ElixirScript.load_config(path)
    end

    Enum.each(IO.stream(:stdio, 5000), fn(x) ->
      js_ast = ElixirScript.parse_elixir(x)
      |> ElixirScript.post_process_js_ast

      parse_result = case options[:ast] do
        true ->
          Poison.encode!(js_ast)
        _ ->
          ElixirScript.javascript_ast_to_code!(js_ast) 
      end

      IO.write(parse_result)
    end)
  end

  def process({ input, options }) do
    if options_contains_unknown_values(options) do
        process(:help)
    else
        do_process(input, options)
    end
  end

  def do_process(input, options) do
    case options[:config] do
      nil ->
        ElixirScript.load_config()
      path ->
        ElixirScript.load_config(path)
    end

    js_ast = case options[:elixir] do
      true ->
        ElixirScript.parse_elixir(input)
      _ ->
        ElixirScript.parse_elixir_files(input)  
    end

    js_ast = ElixirScript.post_process_js_ast(js_ast)

    parse_result = case options[:ast] do
      true ->
        Poison.encode!(js_ast)
      _ ->
        ElixirScript.javascript_ast_to_code!(js_ast) 
    end

    case options[:output] do
      nil ->
        IO.write(parse_result)
      output_path ->
        ElixirScript.write_to_file(parse_result, output_path)
    end
  end

  def options_contains_unknown_values(options) do
    Enum.any?(options, fn({key, value}) ->
      if key in [:output, :ast, :elixir, :lib, :config] do
        false
      else
        true
      end
    end)
  end
end