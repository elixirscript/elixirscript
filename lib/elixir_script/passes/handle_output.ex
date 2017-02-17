defmodule ElixirScript.Passes.HandleOutput do
  @moduledoc false
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do

    if Map.get(opts, :std_lib, false) do
      State.set_module_data(compiler_data.state, compiler_data.data)
      new_std_state = State.serialize(compiler_data.state)
      stdlib_state_path = Path.join([File.cwd!(), "lib", "elixir_script", "translator", "stdlib_state.bin"])
      File.write!(stdlib_state_path, new_std_state)
      State.stop(compiler_data.state)
    else
      State.stop(compiler_data.state)
      out(compiler_data, opts)
    end
  end

  defp out(compiler_output, %{import_standard_libs: false} = compiler_opts) do
    data = Enum.filter(compiler_output.data, fn({m, d}) -> d.app != :elixir end)

    out(%{ compiler_output | data: data }, Map.delete(compiler_opts, :import_standard_libs))
  end

  defp out(compiler_output, %{output: nil} = compiler_opts) do
    compiler_output
    |> remove_load_only
    |> process_include_path(compiler_opts)
  end

  defp out(compiler_output, %{output: :stdout} = compiler_opts) do
    compiler_output
    |> remove_load_only
    |> process_include_path(compiler_opts)
    |> Enum.each(fn
      {_, code, _} -> IO.write(code)
      code -> IO.write(code)
    end)
  end

  defp out(compiler_output, %{output: output_path, core_path: _} = compiler_opts) do
    if Map.get(compiler_opts, :std_lib, false) == false do
      ElixirScript.copy_stdlib_to_destination("es", output_path)
    end

    compiler_output = remove_load_only(compiler_output)

    compiler_output.data
    |> Enum.each(fn({_, x}) ->
      write_to_file(x, output_path)
    end)
  end

  defp write_to_file(module_data, destination) do
    file_name = Path.join([destination, to_string(module_data.app), module_data.javascript_name])

    if !File.exists?(Path.dirname(file_name)) do
      File.mkdir_p!(Path.dirname(file_name))
    end

    File.write!(file_name, module_data.javascript_code)
  end

  defp process_include_path(compiler_output, compiler_opts) do
    compiler_output.data
    |> Enum.map(fn
      {_, module_data} ->
        case compiler_opts.include_path do
          true ->
            { module_data.javascript_name, module_data.javascript_code, module_data.app }
          false ->
            module_data.javascript_code
        end
    end)
  end

  defp remove_load_only(compiler_output) do
    data = Enum.filter(compiler_output.data, fn({m, d}) -> Map.get(d, :load_only, false) == false end)
    %{ compiler_output | data: data }
  end
end
