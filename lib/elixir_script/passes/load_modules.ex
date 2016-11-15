defmodule ElixirScript.Passes.LoadModules do

  def execute(compiler_data, _) do

    ex_files = Enum.map(compiler_data.data, fn
      { _, %{path: path} } -> path
      %{path: path} -> path
    end)

    loaded_modules = case Enum.reverse(ex_files) do
                       [] ->
                         []
                       files ->
                         Kernel.ParallelCompiler.files(files)
                     end

    Map.put(compiler_data, :loaded_modules, loaded_modules)
  end

end
