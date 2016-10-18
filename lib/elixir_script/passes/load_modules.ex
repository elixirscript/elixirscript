defmodule ElixirScript.Passes.LoadModules do
  @pass 5

  def execute(compiler_data, opts) do
    ex_files = Enum.map(compiler_data.data, fn { module, %{path: path} } -> path end)
    |> Enum.filter(fn path -> Path.extname(path) == ".ex" || Path.extname(path) == ".exs" end)

    loaded_modules = Kernel.ParallelRequire.files(ex_files)
    Map.put(compiler_data, :loaded_modules, loaded_modules)
  end

end
