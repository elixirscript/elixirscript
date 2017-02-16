defmodule ElixirScript.Passes.FindChangedFiles do
  @moduledoc false  
  alias ElixirScript.Compiler.Cache
  alias ElixirScript.Translator.State
  @version Mix.Project.config[:version]

  def execute(compiler_data, opts) do
    compiler_cache = Cache.get_compiler_cache(compiler_data.path, opts)
    new_file_stats = Enum.map(compiler_data.data, fn({_, data}) -> { data.path, data.stat } end) |> Enum.uniq

    changed_files = Cache.get_changed_files(compiler_cache.input_files, new_file_stats)
    |> Enum.map(fn {file, _} -> file end)


    State.deserialize(compiler_data.state, compiler_cache.state, compiler_data.loaded_modules)


    Map.put(compiler_data, :changed_files, changed_files)
  end
end
