defmodule ElixirScript.Passes.RemoveUnused do
  @pass 4

  def execute(compiler_data, opts) do
    data = Enum.filter(compiler_data.data, fn({module_name, _}) ->
      module_found_in_deps(module_name, compiler_data.data, [opts[:app]]) == true
    end)

    Map.put(compiler_data, :data, data)
  end

  defp module_found_in_deps(module_name, module_filepath_map, apps_not_to_touch) do
    Enum.any?(module_filepath_map, fn
      ({_, %{deps: deps, app: app, type: :module}}) ->
        Enum.member?(apps_not_to_touch, app) or Enum.member?(deps, module_name)
      _ ->
        true
    end)
  end
end
