defmodule ElixirScript.Passes.ASTFromFile do
  @moduledoc false

  def execute(compiler_data, opts) do
    data = Enum.reduce(compiler_data.data, [], fn({dep, paths}, list) ->

      file_paths = paths
      |> Enum.flat_map(fn(path) -> Path.join([path, "**", "*.{ex,exs,exjs}"]) |> Path.wildcard end)
      |> Enum.reduce([], fn(path, list) ->
        quoted = path
        |> File.read!
        |> Code.string_to_quoted!

        stat = File.stat!(path)

        list ++ [%{path: path, app: dep, stat: stat, ast: quoted}]
      end)


      list ++ file_paths
    end)

    Map.put(compiler_data, :data, data)
  end

end
