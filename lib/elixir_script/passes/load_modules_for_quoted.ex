defmodule ElixirScript.Passes.LoadModulesForQuoted do
  @moduledoc false
  def execute(compiler_data, _) do
    quoted = compiler_data.data
    |> Enum.filter(fn
      {_, %{app: :elixir}} ->
        false
      %{app: :elixir} ->
        false
      _ -> true
    end)
    |> Enum.map(fn
      {_, %{ast: ast}} -> ast
      %{ast: ast} -> ast
    end)

    loaded_modules = Map.get(compiler_data, :loaded_modules, [])

    loaded_modules_from_quoted = quoted
    |> Enum.map(&Code.compile_quoted(&1))
    |> List.flatten
    |> Enum.map(fn {mod, _} -> mod end)


    Map.put(compiler_data, :loaded_modules, loaded_modules ++ loaded_modules_from_quoted)
  end

end