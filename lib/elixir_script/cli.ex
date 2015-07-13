defmodule ElixirScript.CLI do
  @moduledoc false

  def main(argv) do
    argv
    |> parse_args
    |> process
  end

  def parse_args(args) do
    switches = [ 
      output: :binary, elixir: :boolean, root: :binary, 
      help: :boolean
    ]

    aliases = [ 
      o: :output, ex: :elixir, h: :help, r: :root 
    ]
    
    parse = OptionParser.parse(args, switches: switches, aliases: aliases)

    case parse do
      { [help: true] , _ , _ } -> :help
      { options , [input], _ } -> { input, options }
    end

  end

  def process(:help) do
    IO.write """
      usage: ex2js <input> [options]
      <input> path to elixir files or 
              the elixir code string if the -ex flag is used
      options:
      -o  --output [path]   places output at the given path
      -ex --elixir          read input as elixir code string
      -r  --root [path]     root path for standard libs
      -h  --help            this message
    """
  end

  def process({ input, options }) do
    if options_contains_unknown_values(options) do
        process(:help)
    else
        do_process(input, options)
    end
  end

  def do_process(input, options) do
    transpile_opts = [ 
      root: options[:root], 
      include_path: options[:output] != nil 
    ]

    transpile_output = case options[:elixir] do
      true ->
        ElixirScript.transpile(input, transpile_opts)
      _ ->
        ElixirScript.transpile_path(input, transpile_opts)  
    end

    case options[:output] do
      nil ->
        Enum.each(transpile_output, 
          fn
          ({_path, code})-> IO.write(code) 
          (code)-> IO.write(code) 
        end)
      output_path ->
        Enum.each(transpile_output, fn(x) ->
          write_to_file(x, output_path) 
        end)

        ElixirScript.copy_standard_libs_to_destination(output_path)
    end
  end

  defp options_contains_unknown_values(options) do
    Enum.any?(options, fn({key, _value}) ->
      if key in [:output, :elixir, :root, :help] do
        false
      else
        true
      end
    end)
  end

  def write_to_file({ file_path, js_code }, destination) do
    file_name = Path.join([destination, file_path])

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, js_code)
  end
end
