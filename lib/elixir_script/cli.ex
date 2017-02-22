defmodule ElixirScript.CLI do
  @moduledoc false

  @app_version Mix.Project.config()[:version]

  @switches [
    output: :string, elixir: :boolean,
    help: :boolean, core_path: :string,
    full_build: :boolean, version: :boolean,
    watch: :boolean, format: :string, config: :boolean
  ]

  @aliases [
    o: :output, ex: :elixir, h: :help, v: :version, f: :format, c: :config
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
  the elixir code string if passed the -ex flag

  options:
  -c  --config          a path to an elixirscript configuration file
  -f  --format [format] module format of output. options: es (default), common, umd
  -o  --output [path]   places output at the given path
  -ex --elixir          read input as elixir code string
  --full-build          informs the compiler to do a full build instead of an incremental one
  --core-path    import path to the elixirscript standard lib
  only used with the [output] option. When used, Elixir.js is not exported
  -v  --version         the current version number
  -h  --help            this message

  Will check for an elixirscript.exs file in the current directory.
  A specific file can be given with the -c flag.

  A config file contain only a keyword list with have the following format:
  [
    input: (string or list) The input path(s),
    output: (string) the output path,
    format: (atom) the moduel format of the output,
    js_modules: (keyword) a list of the js modules that will be used
  ]

  All fields are optional and will fallback to flags given
  The config option is not compatible with the -ex flag


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
      output: Keyword.get(options, :output, :stdout),
      format: String.to_atom(Keyword.get(options, :format, "es"))
    }

    case options[:elixir] do
      true ->
        ElixirScript.compile(input, compile_opts)
      _ ->
        config = options
        |> Keyword.get(:config, "elixirscript.exs")
        |> handle_config
        |> Map.new

        input = Map.get(config, :input, handle_input(input))
        {_, config} = Map.pop(config, :input)

        compile_opts = Map.merge(compile_opts, config)

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

  defp handle_input(input) do
        input = input
        |> Enum.map(fn(x) -> String.split(x, [" ", ","], trim: true) end)
        |> List.flatten
  end


  defp handle_config(path) do
    if File.exists?(path) do
      {config, _} = Code.eval_file(path)
      config
    else
      []
    end
  end

end
