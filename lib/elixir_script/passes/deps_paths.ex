defmodule ElixirScript.Passes.DepsPaths do

  def execute(compiler_data, opts) do
    data = [{opts[:app], List.wrap(compiler_data.path)}]
    Map.put(compiler_data, :data, data)
  end

end
