defmodule ElixirScript.Passes.DepsPaths do
  @pass 1

  def execute(path, opts) do
    if Code.ensure_loaded?(Mix) do
      deps = get_deps_paths(Mix.env)
      deps ++ [{opts[:app], [path]}]
    else
      [{opts[:app], [path]}]
    end
  end

  defp get_deps_paths(env) do
    Mix.Dep.loaded([env: env])
    |> do_get_deps_paths
  end

  defp do_get_deps_paths(deps) do
    Enum.reduce(deps, [], fn(dep, list) ->
      paths = Mix.Project.in_project dep.app, dep.opts[:dest], fn mixfile -> Mix.Project.config()[:elixirc_paths] end
      paths = Enum.map(paths, fn path -> Path.join([dep.opts[:dest], path]) end)

      deps = do_get_deps_paths(dep.deps)

      deps ++ [{dep.app, paths}] ++ list
    end)
    |> Enum.uniq
  end

end
