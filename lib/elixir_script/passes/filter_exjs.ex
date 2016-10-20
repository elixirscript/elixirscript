defmodule ElixirScript.Passes.FilterExjs do


  def execute(compiler_data, opts) do

    data = Enum.filter(compiler_data.data, fn
      {m, data} -> Path.extname(data.path) == ".exjs"
      data -> Path.extname(data.path) == ".exjs"
    end)

    Map.put(compiler_data, :data, data)
  end

end
