defmodule ElixirScript.CLI do
  @moduledoc false

  @app_version Mix.Project.config()[:version]

  @switches [
    output: :string, elixir: :boolean,
    help: :boolean, core_path: :string,
    full_build: :boolean, version: :boolean,
    watch: :boolean, format: :string
  ]

  @aliases [
    o: :output, ex: :elixir, h: :help, v: :version, f: :format
  ]

  def main(argv) do
    argv
    |> parse_args
    |> process
  end

  def parse_args(args) do
    { options, input, errors } = OptionParser.parse(args, switches: @switches, aliases: @aliases)

    cond do
      length(errors) > 0 ->
        :help
      Keyword.get(options, :help, false) ->
        :help
      Keyword.get(options, :version, false) ->
        :version
      length(input) == 0 ->
        :help
      true ->
        { input, options }
    end

  end

  def help_message() do
  """
  usage: elixirscript <input> [options]
  <input> path to elixir files or
  the elixir code string if the -ex flag is used
  options:
  -f  --format [format] module format of output. options: es (default), common, umd
  -o  --output [path]   places output at the given path
  -ex --elixir          read input as elixir code string
  --full-build          informs the compiler to do a full build instead of an incremental one
  only used when output is specified
  --core-path    import path to the elixirscript standard lib
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
      include_path: true,
      core_path: Keyword.get(options, :core_path, "Elixir.Bootstrap"),
      full_build: Keyword.get(options, :full_build, false),
      output: Keyword.get(options, :output, :stdout)
    }

    case options[:elixir] do
      true ->
        ElixirScript.compile(input, compile_opts)
      _ ->
        input = input
        |> Enum.map(fn(x) -> String.split(x, [" ", ","], trim: true) end)
        |> List.flatten

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
