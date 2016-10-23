defmodule ElixirScript.Passes.DepsPaths do
  @pass 1


  def execute(compiler_data, opts) do
    data = cond do
      Map.get(opts, :std_lib, false) ->
        [{opts[:app], List.wrap(compiler_data.path)}]
      Code.ensure_loaded?(Mix) ->
        deps = get_deps_paths(Mix.env)
        deps ++ [{opts[:app], List.wrap(compiler_data.path)}]
      true ->
        [{opts[:app], List.wrap(compiler_data.path)}]
    end

    Map.put(compiler_data, :data, data)
  end

  defp get_deps_paths(env) do
    Mix.Dep.loaded([env: env])
    |> do_get_deps_paths
  end

  defp do_get_deps_paths(deps) do
    Enum.reduce(deps, [], fn(dep, list) ->
      elixirscript_config = Mix.Project.in_project dep.app, dep.opts[:dest], fn _ -> Mix.Project.config()[:elixir_script] end
      case elixirscript_config do
        nil ->
          list

        config ->
          paths = Keyword.get(config, :input, "") |> List.wrap
          paths = Enum.map(paths, fn path -> Path.join([dep.opts[:dest], path]) end)
          deps = do_get_deps_paths(dep.deps)
          deps ++ [{dep.app, paths}] ++ list
      end
    end)
    |> Enum.uniq
  end

end
