defmodule ElixirScript.Passes.HandleOutput do
  @pass 11
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    if opts.std_lib do
      State.set_module_data(compiler_data.data)
      new_std_state = State.serialize()
      stdlib_state_path = Path.join([File.cwd!(), "lib", "elixir_script", "translator", "stdlib_state.bin"])
      File.write!(stdlib_state_path, new_std_state)
    end

    State.stop()
    out(compiler_data, opts)
  end

  defp out(compiler_output, %{output: nil} = compiler_opts) do
    compiler_output
    |>  process_include_path(compiler_opts)
  end

  defp out(compiler_output, %{output: :stdout} = compiler_opts) do
    compiler_output
    |>  process_include_path(compiler_opts)
    |> Enum.each(fn
      {_, code, _} -> IO.write(code)
      code -> IO.write(code)
    end)
  end

  defp out(compiler_output, %{output: output_path, core_path: core_path} = compiler_opts) do
    Enum.each(compiler_output, fn(x) ->
      write_to_file(x, output_path)
    end)

    ElixirScript.copy_stdlib_to_destination(output_path)
  end

  defp write_to_file({_, module_data}, destination) do
    file_name = Path.join([destination, to_string(module_data.app), module_data.javascript_name])

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, module_data.javascript_code)
  end

  defp process_include_path(compiler_output, compiler_opts) do
    Enum.map(compiler_output, fn
      {module_name, module_data} ->
        case compiler_opts.include_path do
          true ->
            { module_data.javascript_name, module_data.javascript_code, module_data.app }
          false ->
            module_data.javascript_code
        end
    end)
  end
end
