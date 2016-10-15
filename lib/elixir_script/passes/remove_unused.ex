defmodule ElixirScript.Passes.RemoveUnused do
  @pass 4

  def execute(module_filepath_map, opts) do
    Enum.filter(module_filepath_map, fn({module_name, _}) ->
      module_found_in_deps(module_name, module_filepath_map, [opts[:app]]) == true
    end)
  end

  defp module_found_in_deps(module_name, module_filepath_map, apps_not_to_touch) do
    Enum.any?(module_filepath_map, fn({_, %{deps: deps, app: app}}) ->
      Enum.member?(apps_not_to_touch, app) or Enum.member?(deps, module_name)
    end)
  end
end
