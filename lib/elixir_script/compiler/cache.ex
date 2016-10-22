defmodule ElixirScript.Compiler.Cache do
  @moduledoc false
  require Logger

  def delete(path) do
    case get_tmp_file(path) do
      nil ->
        nil
      tmp_file ->
        if !File.exists?(tmp_file) do
          File.rm(tmp_file)
        end
    end
  end

  def get(path) do
    case get_tmp_file(path) do
      nil ->
        nil
      tmp_file ->
        if File.exists?(tmp_file) do
          case File.read(tmp_file) do
            {:ok, data} ->
              :erlang.binary_to_term(data)
            {:error, reason} ->
              Logger.info("Unable to read compiler cache")
              Logger.info(reason)
              nil
          end
        else
          nil
        end
    end
  end

  def write(path, stats) do
    case get_tmp_file(path) do
      nil ->
        { :error, nil }
      tmp_file ->
        case File.write(tmp_file, :erlang.term_to_binary(stats)) do
          :ok ->
            :ok
          {:error, reason} ->
            Logger.info("Unable to write compiler cache")
            Logger.info(reason)
            { :error, reason }
        end
    end
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

  def new(state) do
    %{
      input_files: [],
      state: state,
      full_build?: true,
      version: ElixirScript.version()
    }
  end

  defp get_tmp_file(path) do
    case System.tmp_dir do
      nil ->
        nil
      tmp ->
        tmp_dir = Path.join([tmp, "elixirscript"])
        if !File.exists?(tmp_dir) do
          case File.mkdir_p(tmp_dir) do
            :ok ->
              encoded_path = Path.absname(path) |> Path.dirname |> Base.encode64
              Path.join([tmp_dir, encoded_path])
            {:error, reason} ->
              Logger.info("Unable to write compiler cache")
              Logger.info(reason)
              nil
          end
        else
          encoded_path = Path.absname(path) |> Path.dirname |> Base.encode64
          Path.join([tmp_dir, encoded_path])
        end
    end
  end

  def get_compiler_cache(path, opts) do
    refresh_cache = cond do
      Map.get(opts, :full_build) ->
        true
      empty?(opts.output) ->
        true
      old_version?(opts) ->
        true
      get(path) == nil ->
        true
      true ->
        false
    end

    if refresh_cache do
      delete(path)
      new(ElixirScript.get_stdlib_state())
    else
      %{ get(path) | full_build?: false }
    end
  end

  defp empty?(path) when is_binary(path) do
    case File.ls(path) do
      {:ok, []} ->
        true
      {:error, _} ->
        true
      _ ->
        false
    end
  end

  defp empty?(_) do
    true
  end

  defp old_version?(opts) do
    cache_version = Map.get(opts, :version, nil)
    cache_version == ElixirScript.version()
  end


end
