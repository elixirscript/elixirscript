defmodule Mix.Tasks.Compile.ElixirScript do
  use Mix.Task

  @recursive true

  @moduledoc """
  Mix compiler to allow mix to compile Elixirscript source files into JavaScript

  Looks for an `elixir_script` or `elixirscript` key in your mix project config

      def project do
        [
          app: :my_app,
          version: "0.1.0",
          elixir: "~> 1.0",
          deps: deps,
          elixir_script: [ entry: Example, output: "dest/js"],
          compilers: Mix.compilers ++ [:elixir_script]
        ]
      end

  Available options are:
  * `input`: The module or modules that are the entry to your application (required)
  * `output`: The path of the generated JavaScript file. (defaults to `priv/elixirscript`)

    If path ends in `.js` then that will be the name of the file. If a directory is given,
    file will be named `Elixir.App.js`
  * `format`: The module format of generated JavaScript code. (defaults to `:es`).
    Choices are:
      * `:es` - ES Modules
      * `:common` - CommonJS
      * `:umd` - UMD

  The mix compiler will also compile any dependencies that have the elixirscript compiler in its mix compilers as well
  """


  @spec run(any()) :: :ok
  def run(_) do
    do_compile()
    :ok
  end

  defp do_compile() do
    {input, opts} = get_compiler_params()
    ElixirScript.Compiler.compile(input, opts)
  end

  def clean do
    {_, opts} = get_compiler_params()

    case opts[:output] do
      path when is_binary(path) ->
        file_name = ElixirScript.Output.get_output_file_name(path)
        File.rm!(file_name)
      _ ->
        nil
    end
    :ok
  end

  @doc false
  def get_compiler_params() do
    elixirscript_config = get_elixirscript_config()
    input = Keyword.fetch!(elixirscript_config, :input)
    opts = [
      output: Keyword.get(elixirscript_config, :output),
      format: Keyword.get(elixirscript_config, :format),
      js_modules: Keyword.get(elixirscript_config, :js_modules, [])
    ]

    {input, opts}
  end

  defp get_elixirscript_config() do
    config  = Mix.Project.config
    exjs_config = cond do
      Keyword.has_key?(config, :elixir_script) ->
        Keyword.get(config, :elixir_script, [])
      Keyword.has_key?(config, :elixirscript) ->
        Keyword.get(config, :elixirscript, [])
      true ->
        defaults()
    end

    Keyword.merge(defaults(), exjs_config)
  end

  defp defaults() do
    [
      output: "priv/elixirscript",
      format: :es
    ]
  end

end
