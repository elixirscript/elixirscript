defmodule ElixirScript.CLI do
  def main(argv) do
    argv
    |> parse_args
    |> process
  end

  def parse_args(args) do
    switches = [ 
      output: :binary, ast: :boolean, elixir: :boolean, 
      help: :boolean, stdio: :boolean
    ]

    aliases = [ o: :output, t: :ast, ex: :elixir, h: :help, st: :stdio ]
    
    parse = OptionParser.parse(args, switches: switches, aliases: aliases)

    case parse do
      { [help: true] , _ , _ } -> :help

      { [{:stdio, true} | options] , [], _ } -> { :stdio, options }

      { options , [input], _ } -> { input, options }
    end

  end

  def process(:help) do
    IO.write """
      usage: ex2js <input> [options]

      <input> path to elixir files or 
              the elixir code string if the -ex flag is used

      options:

      -ex --elixir          read input as elixir code string
      -t  --ast             shows only produced spider monkey ast
      -c  --config [path]   path to exjs.exs configuration file (defaults to exjs.exs)
      -h  --help            this message
    """
  end

  def process({ :stdio, options }) do

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
    js_ast = case options[:elixir] do
      true ->
        ElixirScript.parse_elixir(input)
      _ ->
        ElixirScript.parse_elixir_files(input)  
    end

    js_ast = ElixirScript.post_process_js_ast(js_ast)

    handle_output(js_ast, options)
  end

  def handle_output(js_ast, options) when is_list(js_ast) do
    parse_result = case options[:ast] do
                     true ->
                       Enum.map(js_ast, fn({path, code}) ->
                         {path, Poison.encode!(code) }
                       end)
                     _ ->
                       Enum.map(js_ast, fn({path, code}) ->
                         {path, ElixirScript.javascript_ast_to_code!(code)}
                       end)
                   end
    

    case options[:output] do
      nil ->
        Enum.each(parse_result, fn({path, code})-> IO.write(code) end)
      output_path ->
        Enum.each(parse_result, fn(x) ->
          ElixirScript.write_to_file(x, output_path) 
        end)

        ElixirScript.copy_standard_libs_to_destination(output_path)
        
    end    
  end

  def handle_output(js_ast, options) do
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
      if key in [:output, :ast, :elixir] do
        false
      else
        true
      end
    end)
  end
end
