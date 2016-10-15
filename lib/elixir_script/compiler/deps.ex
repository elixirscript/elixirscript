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

  def get_module_filepath_map(env \\ Mix.env) do
    deps_paths = get_deps_paths(env)

    Enum.reduce(deps_paths, [], fn({dep, paths}, list) ->

      file_paths = Enum.flat_map(paths, fn(path) ->
        path = Path.join(path, "**/*.{ex,exs,exjs}")
        |> Path.wildcard
      end)

      file_paths = Enum.reduce(file_paths, [], fn(path, list) ->
        quoted = path
        |> File.read!
        |> Code.string_to_quoted!

        { _, modules } = Macro.postwalk(quoted, [], &get_defmodules(&1, &2))

        modules = Enum.map(modules, fn(x) -> { x.module,  Map.put(x, :path, path) |> Map.put(:app, dep) } end)
        list ++ modules
      end)


      list ++ file_paths
    end)

  end


  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, _]} = ast, state) do
    s = %{ module:  Utils.quoted_to_name(the_alias),  type: :protocol }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, _]} = ast, state) do
    s =  %{module:  Utils.quoted_to_name(the_alias), type: :protocol }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  _ ]} = ast, state) do
    s =  %{module:  Utils.quoted_to_name(the_alias), type: :impl, for: Utils.quoted_to_name(type) }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  _ ]} = ast, state) do
    s = %{module:  Utils.quoted_to_name(the_alias), type: :impl, for: Utils.quoted_to_name(type) }
    { ast, state ++ [s] }
  end

  defp get_defmodules({:defmodule, _, [{:__aliases__, _, _} = the_alias, [do: _]]} = ast, state) do
    s = %{module:  Utils.quoted_to_name(the_alias), type: :module }
    { ast, state ++ [s] }
  end

  defp get_defmodules(ast, state) do
    { ast, state }
  end

end
