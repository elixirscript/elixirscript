defmodule ElixirScript.Compiler.Deps do
  alias ElixirScript.Translator.Utils

  def get_deps_paths(env \\ Mix.env) do
    deps = Mix.Dep.loaded([env: "env"])

    Enum.reduce(deps, Map.new, fn(dep, map) ->
      paths = Mix.Project.in_project dep.app, dep.opts[:dest], fn mixfile -> Mix.Project.config()[:elixirc_paths] end
      paths = Enum.map(paths, fn path -> Path.join([dep.opts[:dest], path]) end)

      Map.put(map, dep.app, paths)
    end)
  end

  def get_module_filepath_map(env \\ Mix.env) do
    deps_paths = get_deps_paths(env)

    Enum.reduce(deps_paths, Map.new, fn({dep, paths}, map) ->

      file_paths = Enum.flat_map(paths, fn(path) ->
        path = Path.join(path, "**/*.{ex,exs,exjs}")
        |> Path.wildcard
      end)

      file_paths = Enum.reduce(file_paths, Map.new, fn(path, map) ->
        quoted = path
        |> File.read!
        |> Code.string_to_quoted!

        { _, modules } = Macro.postwalk(quoted, %{protocols: [], modules: [], impls: []}, &get_defmodules(&1, &2))

        { path, modules }
        Map.put(map, path, modules)
      end)

      {dep, file_paths}
      Map.put(map, dep, file_paths)
    end)

  end


  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, _]} = ast, state) do
    state = Map.update!(state, :protocols, fn(l) -> [ Utils.quoted_to_name(the_alias) | l ] end)
    { ast, state }
  end

  defp get_defmodules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, _]} = ast, state) do
    state = Map.update!(state, :protocols, fn(l) -> [ Utils.quoted_to_name(the_alias) | l ] end)
    { ast, state }
  end

  defp get_defmodules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  _ ]} = ast, state) do
    state = Map.update!(state, :impls, fn(l) -> [  { Utils.quoted_to_name(the_alias), Utils.quoted_to_name(type) } | l ] end)
    { ast, state }
  end

  defp get_defmodules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  _ ]} = ast, state) do
    state = Map.update!(state, :impls, fn(l) -> [  { Utils.quoted_to_name(the_alias), Utils.quoted_to_name(type) } | l ] end)
    { ast, state }
  end

  defp get_defmodules({:defmodule, _, [{:__aliases__, _, _} = the_alias, [do: _]]} = ast, state) do
    state = Map.update!(state, :modules, fn(l) -> [ Utils.quoted_to_name(the_alias) | l ] end)
    { ast, state }
  end

  defp get_defmodules(ast, state) do
    { ast, state }
  end

end
