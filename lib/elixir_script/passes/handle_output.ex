defmodule ElixirScript.Passes.HandleOutput do
  @moduledoc false
  alias ElixirScript.Translator.State
  @generated_name "Elixir.App.js"

  def execute(compiler_data, opts) do
    State.stop(compiler_data.state)
    out(compiler_data, opts)
  end

  defp out(compiler_output, %{output: nil} = compiler_opts) do
    compiler_output
    |> process_include_path(compiler_opts)
  end

  defp out(compiler_output, %{output: :stdout} = compiler_opts) do
    out = compiler_output
    |> process_include_path(compiler_opts)

    code = case out do
      {code, _} -> code
      code -> code
    end

    IO.write(concat(code)) 
  end

  defp out(compiler_output, %{output: output_path, core_path: _}) do
    file_name = get_js_path(output_path)

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, concat(compiler_output.generated))
  end

  defp concat(code) do
    "'use strict';\n" <> ElixirScript.get_bootstrap_js("iife") <> "\n" <> code
  end

  def get_js_path(nil), do: @generated_name
  def get_js_path(:stdout), do: @generated_name

  def get_js_path(output_path) do
    case Path.extname(output_path) do
      ".js" ->
        output_path
      _ ->
        Path.join([output_path, @generated_name])
    end
  end

  defp process_include_path(compiler_output, compiler_opts) do
      case compiler_opts.include_path do
        true ->
          {compiler_output.generated, get_js_path(compiler_opts.output)}
        false ->
          compiler_output.generated
      end
  end
end
