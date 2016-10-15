defmodule ElixirScript.Passes.ModuleFilepaths do
  @pass 2

  alias ElixirScript.Translator.Utils

  def execute(deps_paths, _) do
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
    { ast, do_module_processing(ast, state) }
  end

  defp get_defmodules(ast, state) do
    { ast, state }
  end

  defp do_module_processing({:defmodule, context1, [{:__aliases__, _, name} = the_alias, [do: body]]}, state) do
    { body, inner_modules } = make_inner_module_aliases(name, body)

    aliases = Enum.map(inner_modules, fn
      ({:defmodule, _, [{:__aliases__, _, inner_module_name}, [do: inner_module_body]]}) ->
        { :alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}, [as: {:__aliases__, [alias: false], inner_module_name }] ] }
    end)

    state = Enum.reduce(inner_modules, state, fn
      ({:defmodule, context1, [{:__aliases__, context2, inner_module_name}, [do: inner_module_body]]}, state) ->

        module_name = Utils.quoted_to_name({:__aliases__, [], tl(name) ++ inner_module_name})
        state = Enum.reject(state, fn(x) -> x.module == module_name end)

        this_module_aliases = aliases -- [{ :alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}, [as: {:__aliases__, [alias: false], inner_module_name }] ] }]

        do_module_processing(
          {:defmodule, context1, [{:__aliases__, context2, name ++ inner_module_name}, [do: add_aliases_to_body(inner_module_body, this_module_aliases)]]},
          state)
    end)


    [%{module: Utils.quoted_to_name(the_alias), type: :module, ast: {:defmodule, context1, [the_alias, [do: body]]} }] ++ state
  end

  defp add_aliases_to_body(body, aliases) do
    case body do
      { :__block__, context, body } ->
        { :__block__, context, aliases ++ List.wrap(body) }
      _ ->
        { :__block__, [], aliases ++ List.wrap(body) }
    end
  end

  defp make_inner_module_aliases(name, body) do
    case body do
      nil ->
        { { :__block__, [], [] }, [] }

      {:__block__, context, list2 } ->
        { list2, inner_modules } = Enum.partition(list2, fn(x) ->
        case x do
          {:defmodule, _, [{:__aliases__, _, inner_module_name}, [do: inner_module_body]]} ->
            false
          _ ->
            true
        end
      end)

        { {:__block__, context, list2}, inner_modules }
      {:defmodule, _, [{:__aliases__, context, inner_module_name}, [do: inner_module_body]]} = mod ->
        { {:__block__, context, [] }, [mod] }
      _ ->
        { body, [] }
    end
  end
end
