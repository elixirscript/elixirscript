defmodule ElixirScript.Passes.WriteCache do
  alias ElixirScript.Compiler.Cache
  alias ElixirScript.Translator.State

  def execute(compiler_data, opts) do
    compiler_cache = Cache.get_compiler_cache(compiler_data.path, opts)

    State.set_module_data(compiler_data.data)
    new_state = State.serialize()
    new_file_stats = Enum.filter(compiler_data.data, fn({ _, data }) -> Map.has_key?(data, :path) end)
    |> Enum.map(fn({_, data}) -> { data.path, data.stat } end)
    |> Enum.uniq

    compiler_cache = %{compiler_cache | input_files: new_file_stats, state: new_state }

    Cache.write(compiler_data.path, compiler_cache)

    compiler_data
  end


end
