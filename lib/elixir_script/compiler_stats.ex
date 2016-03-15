defmodule ElixirScript.CompilerStats do
  @moduledoc false

  def delete_compiler_stats(path) do
    tmp_file = get_tmp_file(path)
    if !File.exists?(tmp_file) do
      File.rm(tmp_file)
    end
  end

  def get_compiler_stats(path) do
    tmp_file = get_tmp_file(path)
    if File.exists?(tmp_file) do
      File.read!(tmp_file)
      |> :erlang.binary_to_term
    else
      nil
    end
  end

  def save_compiler_stats(path, stats) do
    tmp_file = get_tmp_file(path)
    File.write!(tmp_file, :erlang.term_to_binary(stats))
  end

  def get_changed_files(old_file_stats, new_file_stats) do
    if(length(old_file_stats) != length(new_file_stats)) do
      new_file_stats
    else
      old_file_stats = Enum.sort(old_file_stats, fn {file1, _}, {file2, _} -> file1 < file2 end)
      new_file_stats = Enum.sort(new_file_stats, fn {file1, _}, {file2, _} -> file1 < file2 end)
      zipped = Enum.zip(old_file_stats, new_file_stats)

      if(Enum.any?(zipped, fn({ {old_file, _} , {new_file, _ } }) ->  old_file != new_file end)) do
        new_file_stats
      else
        Enum.reduce(zipped, [], fn({ {_, old_stat} , {_, new_stat } = new }, state) ->
          cond do
            old_stat.mtime != new_stat.mtime ->
              state ++ [new]
            true ->
              state
          end
        end)
      end
    end
  end

  def build_file_stats(path) do
    Enum.map(path, fn(file) ->
      { file, File.stat!(file) }
    end)
  end

  def new_compile_stats(state) do
    %{
      files: [],
      state: state
    }
  end

  defp get_tmp_file(path) do
    tmp_dir = Path.join([System.tmp_dir!, "elixirscript"])

    if !File.exists?(tmp_dir) do
      File.mkdir_p!(tmp_dir)
    end

    encoded_path = Path.absname(path) |> Path.dirname |> Base.encode64
    Path.join([tmp_dir, encoded_path])

  end

end
