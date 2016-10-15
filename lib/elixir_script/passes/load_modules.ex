defmodule ElixirScript.Passes.LoadModules do
  @pass 5

  def execute(data, opts) do
    ex_files = Enum.map(data, fn { module, %{path: path} } ->  path end)
    |> Enum.filter(fn path -> Path.extname(path) == ".ex" || Path.extname(path) == ".exs" end)

    loaded_modules = Kernel.ParallelRequire.files(ex_files)

    %{
      data: data,
      loaded_modules: loaded_modules
     }
  end

end
