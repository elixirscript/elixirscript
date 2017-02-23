defmodule ElixirScript.Passes.HandleOutput do
  @moduledoc false
  alias ElixirScript.Translator.State

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

    case out do
      {code, _} -> IO.write(code)
      code -> IO.write(code)
    end
  end

  defp out(compiler_output, %{output: output_path, core_path: _} = compiler_opts) do
    if Map.get(compiler_opts, :std_lib, false) == false do
      ElixirScript.copy_bootstrap_to_destination(compiler_opts.format, output_path)
    end

    file_name = Path.join([output_path, compiler_output.generated_name])

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, compiler_output.generated)
  end

  defp process_include_path(compiler_output, compiler_opts) do
      case compiler_opts.include_path do
        true ->
          {compiler_output.generated, compiler_output.generated_name}
        false ->
          compiler_output.generated
      end
  end
end
