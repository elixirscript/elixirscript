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

  defp out(compiler_output, %{output: output_path, core_path: _} = compiler_opts) do
    file_name = Path.join([output_path, @generated_name])

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, concat(compiler_output.generated))
  end

  defp concat(code) do
    "'use strict';\n" <> ElixirScript.get_bootstrap_js("iife") <> "\n" <> code
  end

  defp process_include_path(compiler_output, compiler_opts) do
      case compiler_opts.include_path do
        true ->
          {compiler_output.generated, @generated_name}
        false ->
          compiler_output.generated
      end
  end
end
