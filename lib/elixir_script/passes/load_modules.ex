defmodule ElixirScript.Passes.LoadModules do
  @moduledoc false  
  def execute(compiler_data, _) do
    ex_files = compiler_data.data
    |> Enum.filter(fn 
      {_, %{app: :elixir}} ->
        false
      %{app: :elixir} ->
        false        
      _ -> true
    end) 
    |> Enum.map(fn
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
