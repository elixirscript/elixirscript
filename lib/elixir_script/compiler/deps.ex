defmodule ElixirScript.Compiler.Deps do
  alias ElixirScript.Translator.Utils

  def get_deps_paths(env \\ Mix.env) do
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

  def get_module_filepath_map(deps_paths) do
    Enum.reduce(deps_paths, [], fn({dep, paths}, list) ->

      file_paths = Enum.flat_map(paths, fn(path) ->
        path = Path.join(path, "**/*.{ex,exs,exjs}")
        |> Path.wildcard
      end)

      file_paths = Enum.reduce(file_paths, [], fn(path, list) ->
        quoted = path
        |> File.read!
        |> Code.string_to_quoted!

        #TODO: build sumbmodules correctly
        { _, modules } = Macro.postwalk(quoted, [], &get_defmodules(&1, &2))

        modules = Enum.map(modules, fn(x) -> { x.module,  Map.put(x, :path, path) |> Map.put(:app, dep) } end)
        list ++ modules
      end)


      list ++ file_paths
    end)

  end


  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, _]} = ast, state) do
    s = %{ module:  Utils.quoted_to_name(the_alias),  type: :protocol, ast: ast }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, _]} = ast, state) do
    s =  %{module:  Utils.quoted_to_name(the_alias), type: :protocol, ast: ast }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  _ ]} = ast, state) do
    s =  %{module:  Utils.quoted_to_name(the_alias), type: :impl, for: Utils.quoted_to_name(type), ast: ast }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  _ ]} = ast, state) do
    s = %{module:  Utils.quoted_to_name(the_alias), type: :impl, for: Utils.quoted_to_name(type), ast: ast }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defmodule, _, [{:__aliases__, _, _} = the_alias, [do: _]]} = ast, state) do
    s = %{module:  Utils.quoted_to_name(the_alias), type: :module, ast: ast }
    { ast, state ++ [s] }
  end

  defp get_defmodules(ast, state) do
    { ast, state }
  end

  def find_dependencies(module_filepath_map) do
    Enum.map(module_filepath_map, &do_find_dependencies(&1))
  end

  defp do_find_dependencies({ module, module_data }) do
    {_, deps} = Macro.prewalk(module_data.ast, [], &collect_references(&1, &2))
    { module, Map.put(module_data, :deps, deps) }
  end

  defp collect_references({:import, _, [{{:., _, [{:__aliases__, _, head_import_name}, :{}]}, _, tail_imports }]}, state) do
    deps = Enum.map(tail_imports, fn({:__aliases__, context, name}) ->
      full_module_name = { :__aliases__, context, head_import_name ++ name }
      Utils.quoted_to_name(full_module_name)
    end)

    state ++ deps
  end

  defp collect_references({:import, _, [{:__aliases__, _, _} = module_name]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:import, _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    {ast, state ++ [module_name] }
  end

  defp collect_references({:alias, _, [{{:., _, [{:__aliases__, _, head_alias_name}, :{}]}, _, tail_aliases }]} = ast, state) do
    deps = Enum.map(tail_aliases, fn({:__aliases__, context, name}) ->
      full_module_name = { :__aliases__, context, head_alias_name ++ name }
      Utils.quoted_to_name(full_module_name)
    end)

    { ast, state ++ deps }
  end

  defp collect_references({:alias, _, [{:__aliases__, _, _} = module_name] } = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:alias, _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    {ast, state ++ [module_name] }
  end

  defp collect_references({:require, _, [{{:., _, [{:__aliases__, _, head_alias_name}, :{}]}, _, tail_aliases }]} = ast, state) do
    deps = Enum.map(tail_aliases, fn({:__aliases__, context, name}) ->
      full_module_name = { :__aliases__, context, head_alias_name ++ name }
      Utils.quoted_to_name(full_module_name)
    end)

    { ast, state ++ deps }
  end

  defp collect_references({:require, _, [{:__aliases__, _, _} = module_name] } = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:require, _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({:., _, [{:__aliases__, _, _} = module_name, _]} = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references({{:., _, [{:__aliases__, _, _} = module_name, _]}, _, _ } = ast, state) do
    module_name = Utils.quoted_to_name(module_name)
    { ast, state ++ [module_name] }
  end

  defp collect_references(ast, state) do
    { ast, state }
  end

  def remove_modules_not_depended_on(module_filepath_map, apps_not_to_touch) do
    Enum.filter(module_filepath_map, fn({module_name, _}) ->
      module_found_in_deps(module_name, module_filepath_map, List.wrap(apps_not_to_touch)) == true
    end)
  end

  defp module_found_in_deps(module_name, module_filepath_map, apps_not_to_touch) do
    Enum.any?(module_filepath_map, fn({_, %{deps: deps, app: app}}) ->
      Enum.member?(apps_not_to_touch, app) or Enum.member?(deps, module_name)
    end)
  end
end
