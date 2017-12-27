defmodule ElixirScript.CLI do
  @moduledoc false

  @app_version Mix.Project.config()[:version]

  @switches [
    output: :string,
    help: :boolean,
    version: :boolean,
    root: :string
  ]

  @aliases [
    o: :output,
    h: :help,
    v: :version
  ]

  def parse_args(args) do
    {options, input, errors} = OptionParser.parse(args, switches: @switches, aliases: @aliases)

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
        {input, options}
    end
  end

  defp help_message do
    """
    usage: elixirscript <module | path> [options]
    <module> the entry module of your application
    <path> the path to .ex(s) files to compile

    options:
    -o  --output [path]   places output at the given path.
                          Can be a directory or filename.
    -v  --version         the current version number
    -h  --help            this message
    --root                The root import path for FFI imports
    """
  end

  def process(:help) do
    IO.write(help_message())
  end

  def process(:version) do
    IO.write(@app_version)
  end

  def process({input, options}) do
    if options_contains_unknown_values(options) do
      process(:help)
    else
      do_process(input, options)
    end
  end

  defp do_process(input, options) do
    compile_opts = [
      output: Keyword.get(options, :output, :stdout),
      root: Keyword.get(options, :root, ".")
    ]

    input = handle_input(input)
    ElixirScript.Compiler.compile(input, compile_opts)
  end

  defp options_contains_unknown_values(options) do
    Enum.any?(options, fn {key, _value} ->
      if key in Keyword.keys(@switches) do
        false
      else
        true
      end
    end)
  end

  defp handle_input(input) do
    input
    |> Enum.map(fn x -> String.split(x, [" ", ","], trim: true) end)
    |> List.flatten()
    |> Enum.map(fn x -> Module.concat([x]) end)
  end
end
