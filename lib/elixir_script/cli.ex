defmodule ElixirScript.CLI do
  @moduledoc false

  @app_version Mix.Project.config()[:version]

  @switches [
    output: :string,
    help: :boolean,
    version: :boolean,
    watch: :boolean,
    format: :string,
    js_module: [:string, :keep]
  ]

  @aliases [
    o: :output,
    h: :help,
    v: :version,
    f: :format
  ]

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

  defp help_message() do
  """
  usage: elixirscript <module> [options]
  <module> the entry module of your application

  options:
  --js-module [<identifer>:<path>] A js module used in your code. ex: React:react
                        Multiple can be defined
  -f  --format [format] module format of output. options: es (default), common, umd
  -o  --output [path]   places output at the given path.
                        Can be a directory or filename.
  -v  --version         the current version number
  -h  --help            this message
  """
  end

  def process(:help) do
    IO.write help_message()
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

    js_modules = Keyword.get_values(options, :js_module)
    |> build_js_modules

    compile_opts = [
      output: Keyword.get(options, :output, :stdout),
      format: String.to_atom(Keyword.get(options, :format, "es")),
      js_modules: js_modules,
    ]

    input = handle_input(input)
    ElixirScript.Compiler.compile(input, compile_opts)

    if watch do
      ElixirScript.Watcher.start_link(input, compile_opts)
      :timer.sleep :infinity
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
    input
    |> Enum.map(fn(x) -> String.split(x, [" ", ","], trim: true) end)
    |> List.flatten
    |> Enum.map(fn(x) -> Module.concat([x]) end)
  end

  defp build_js_modules(values) do
    values
    |> Enum.map(fn x ->
      [identifier, path] = String.split(x, ":", trim: true)
      { format_identifier(identifier), format_path(path) }
    end)
  end

  defp format_identifier(id) do
    id
    |> String.split(".")
    |> Module.concat
  end


  defp format_path(path) do
    path
    |> String.replace("\"", "")
    |> String.replace("`", "")
    |> String.replace("'", "")
  end
end
