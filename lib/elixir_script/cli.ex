defmodule ElixirScript.CLI do
  @moduledoc false

  @app_version Mix.Project.config()[:version]

  @switches [
    output: :binary, elixir: :boolean, root: :binary,
    help: :boolean, core_path: :binary, std_lib: :binary,
    full_build: :boolean, version: :boolean, watch: :boolean
  ]

  @aliases [
    o: :output, ex: :elixir, h: :help, r: :root, v: :version
  ]

  def main(argv) do
    argv
    |> parse_args
    |> process
  end

  def parse_args(args) do
    parse = OptionParser.parse(args, switches: @switches, aliases: @aliases)

    case parse do
      { [help: true] , _ , _ } -> :help
      { [version: true] , _ , _ } -> :version
      { options , [input], _ } -> { input, options }
      _ -> :help
    end

  end

  def help_message() do
  """
  usage: elixirscript <input> [options]
  <input> path to elixir files or
  the elixir code string if the -ex flag is used
  options:
  -o  --output [path]   places output at the given path
  -ex --elixir          read input as elixir code string
  -r  --root [path]     root import path for all exported modules
  --std-lib [path]      outputs the elixirscript standard library JavaScript files to the specified path
  --full-build          informs the compiler to do a full build instead of an incremental one
  only used when output is specified
  --core-path    es6 import path to the elixirscript standard lib
  only used with the [output] option. When used, Elixir.js is not exported
  -v  --version         the current version number
  -h  --help            this message
  """
  end

  def process(:help) do
    IO.write help_message
  end

  def process(:version) do
    IO.write @app_version
  end

  def process([std_lib: path]) do
    ElixirScript.copy_stdlib_to_destination(path)
  end

  def process({ input, options }) do
    if options_contains_unknown_values(options) do
        process(:help)
    else
        do_process(input, options)
    end
  end

  def do_process(input, options) do
    {watch, options} = Keyword.pop(options, :watch, false)

    compile_opts = %{
      root: options[:root],
      include_path: true,
      core_path: Keyword.get(options, :core_path, "Elixir.Bootstrap"),
      full_build: Keyword.get(options, :full_build, false),
      output: Keyword.get(options, :output, :stdout)
    }

    case options[:elixir] do
      true ->
        ElixirScript.compile(input, compile_opts)
      _ ->
        ElixirScript.compile_path(input, compile_opts)

        if watch do
          ElixirScript.Watcher.start_link(input, compile_opts)
          :timer.sleep :infinity
        end
    end
  end

  defp options_contains_unknown_values(options) do
    Enum.any?(options, fn({key, _value}) ->
      if key in Keyword.keys(@switches) do
        false
      else
        true
      end
    end)
  end
end
