defmodule ElixirScript.Output do
  @moduledoc false

  alias ElixirScript.State, as: ModuleState
  alias ESTree.Tools.{Builder, Generator}
  @generated_name "Elixir.App.js"

  @doc """
  Takes outputs the JavaScript code in the specified output
  """
  @spec execute([atom], pid) :: nil
  def execute(modules, pid) do
    modules = modules
    |> Enum.filter(fn {_, info} -> Map.has_key?(info, :js_ast) end)
    |> Enum.map(fn {_module, info} ->
        info.js_ast
      end
    )

    opts = ModuleState.get_compiler_opts(pid)

    bundle(modules, opts)
    |> output(Map.get(opts, :output))
  end

  defp bundle(modules, opts) do
    modules
    |> ElixirScript.Output.JSModule.compile(opts)
    |> List.wrap
    |> Builder.program
    |> prepare_js_ast
    |> Generator.generate
    |> concat
  end

  defp concat(code) do
    bootstrap_code = get_bootstrap_js()
    "'use strict';\n#{bootstrap_code}\n#{code}"
  end

  defp get_bootstrap_js() do
    operating_path = Path.join([Mix.Project.build_path, "lib", "elixir_script", "priv"])
    path = Path.join([operating_path, "build", "iife", "Elixir.Bootstrap.js"])
    File.read!(path)
  end

  defp prepare_js_ast(js_ast) do
    case js_ast do
      modules when is_list(modules) ->
        modules
        |> Enum.reduce([], &(&2 ++ &1.body))
        |> Builder.program
      _ ->
        js_ast
    end
  end

  defp output(code, nil) do
     code
  end

  defp output(code, :stdout) do
    IO.puts(code)
  end

  defp output(code, path) do
    file_name = get_output_file_name(path)

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, code)
  end

  def get_output_file_name(path) do
    case Path.extname(path) do
      ".js" ->
        path
      _ ->
        Path.join([path, @generated_name])
    end
  end
end