defmodule ElixirScript.Compiler.Output do
  alias ElixirScript.Compiler.Cache

  def out(_, compiler_output, %{output: nil} = compiler_opts) do
    compiler_output ++ ElixirScript.update_protocols(compiler_output, compiler_opts)
    |>  process_include_path(compiler_opts)
  end

  def out(_, compiler_output, %{output: :stdout} = compiler_opts) do
    compiler_output ++ ElixirScript.update_protocols(compiler_output, compiler_opts)
    |>  process_include_path(compiler_opts)
    |> Enum.each(fn
      {_, code} -> IO.write(code)
      code -> IO.write(code)
    end)
  end

  def out(compiler_input, compiler_output, %{output: output_path, core_path: core_path} = compiler_opts) do
    Enum.each(compiler_output, fn(x) ->
      write_to_file(x, output_path)
    end)

    ElixirScript.update_protocols_in_path(compiler_output, compiler_opts, output_path)
    |> Enum.each(fn
      x ->
        write_to_file(x, output_path)
    end)

    if core_path == "Elixir" and Map.get(compiler_opts, :std_lib, false) == false do
      case Cache.get(compiler_input) do
        nil ->
          ElixirScript.copy_core_to_destination(output_path)
        %{ full_build?: true } ->
          ElixirScript.copy_core_to_destination(output_path)
        _ ->
          nil
      end
    end
  end

  def write_to_file({ file_path, js_code }, destination) do
    file_name = Path.join([destination, file_path])

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, js_code)
  end

  defp process_include_path(compiler_output, compiler_opts) do
    Enum.map(compiler_output, fn
      { path, code } ->
        case compiler_opts.include_path do
          true ->
            { path, code }
          false ->
            code
        end
    end)
  end
end
