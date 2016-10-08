defmodule ElixirScript.Compiler.Deps do

  def get_deps_paths(env \\ Mix.env) do
    deps = Mix.Dep.loaded([env: "env"])

    Enum.reduce(deps, Map.new, fn(dep, map) ->
      paths = Mix.Project.in_project dep.app, dep.opts[:dest], fn mixfile -> Mix.Project.config()[:elixirc_paths] end
      paths = Enum.map(paths, fn path -> Path.join([dep.opts[:dest], path]) end)

      Map.put(map, dep.app, paths)
    end)
  end


end
