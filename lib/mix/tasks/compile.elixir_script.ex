defmodule Mix.Tasks.Compile.ElixirScript do
  use Mix.Task

  @recursive true
  @manifest ".compile.elixir_script"
  @manifest_vsn 1

  @moduledoc """
  Mix compiler to allow mix to compile Elixirscript source files into JavaScript

  Looks for an `elixir_script` or `elixirscript` key in your mix project config

      def project do
        [
          app: :my_app,
          version: "0.1.0",
          elixir: "~> 1.0",
          deps: deps,
          elixir_script: [ input: Example, output: "dest/js"],
          compilers: Mix.compilers ++ [:elixir_script]
        ]
      end

  Available options are:
  * `input`: The module or modules that are the entry to your application (required)
  * `output`: The path of the generated JavaScript file. (defaults to `priv/elixir_script/build`)

    If path ends in `.js` then that will be the name of the file. If a directory is given,
    file will be named `elixirscript.build.js`

  * `root`: Optional root for imports of FFI JavaScript modules.
  Defaults to `.`. If using output directly in a browser, you may want to make it something like `/js` or some uri.

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
    :ok
  end

  def manifests, do: [manifest()]
  defp manifest, do: Path.join(Mix.Project.manifest_path(), @manifest)

  @doc false
  def get_compiler_params() do
    elixirscript_config = get_elixirscript_config()
    input = Keyword.fetch!(elixirscript_config, :input)
    opts = [
      output: Keyword.get(elixirscript_config, :output)
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
      output: "priv/elixir_script/build"
    ]
  end

end
