defmodule Mix.Tasks.Compile.ElixirScript do
  use Mix.Task

  @moduledoc """
  Mix compiler to allow mix to compile Elixirscript source files into JavaScript

  Looks for an `elixir_script` or `elixirscript` key in your mix project config

      def project do
        [
          app: :my_app,
          version: "0.1.0",
          elixir: "~> 1.0",
          deps: deps,
          elixir_script: [ input: "src/exjs", output: "dest/js"],
          compilers: [:elixir_script] ++ Mix.compilers
        ]
      end
    
  Available options are:
  * `input`: The folder to look for Elixirscript files in. (defaults to `lib/elixirscript`)
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
    elixirscript_config = get_elixirscript_config()

    elixirscript_base = Path.join([Mix.Project.build_path, "elixirscript"])
    File.mkdir_p!(elixirscript_base)
    elixirscript_path = Path.join([elixirscript_base, "#{Mix.Project.config[:app]}"])

    input_path = elixirscript_config
    |> Keyword.get(:input)
    |> List.wrap
    |> Enum.map(fn(path) ->
      Path.absname(path)
    end)
    |> Enum.join("\n")

    File.write!(elixirscript_path, input_path)

    paths = [elixirscript_base, "*"]
    |> Path.join()
    |> Path.wildcard
    |> Enum.map(fn(path) ->
      app = Path.basename(path)
      paths = path |> File.read!() |> String.split("\n")
      {app, paths}
    end)
    |> Map.new

    output_path = Keyword.get(elixirscript_config, :output)
    format = Keyword.get(elixirscript_config, :format)
    js_modules = Keyword.get(elixirscript_config, :js_modules, [])

    ElixirScript.compile_path(paths, %{output: output_path, format: format, js_modules: js_modules})
    :ok
  end

  def clean do
    elixirscript_config = get_elixirscript_config()
    output_path = Keyword.get(elixirscript_config, :output)

    path = ElixirScript.Passes.HandleOutput.get_js_path(output_path)

    if File.exists?(path) do
      File.rm!(path)
    end

    :ok
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
      input: "lib/elixirscript",
      output: "priv/elixirscript",
      format: :es
    ]
  end

end
