defmodule ElixirScript.Preprocess.Modules do
  @moduledoc false

  alias ElixirScript.State

  @standard_lib_protocols [
    [:Enumerable],
    [:Inspect],
    [:String, :Chars],
    [:List, :Chars],
    [:Collectable]
  ]

  def get_info(modules) do
    Enum.map(modules, fn
      { :__block__, _, list } ->
        {mods, no_mods} = Enum.partition(list, fn
          ({:defprotocol, _, [{:__aliases__, _, protocol}| _ ] }) when not protocol in @standard_lib_protocols ->
            true
          ({:defimpl, _, [ {:__aliases__, _, protocol} | _] }) when not protocol in @standard_lib_protocols ->
            true
          ({:defmodule, _, _}) ->
            true
          _ ->
            false
        end)

        mods ++ [{:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], no_mods }]]}]
      ({:defprotocol, _, [{:__aliases__, _, protocol}| _ ] }) = x when not protocol in @standard_lib_protocols ->
        x
      ({:defimpl, _, [ {:__aliases__, _, protocol} | _] }) = x when not protocol in @standard_lib_protocols ->
        x
      ({:defmodule, _, _}) = x ->
        x
      x ->
        {:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], [x] }]]}
    end)
    |> List.flatten
    |> Enum.each(fn(m) ->
      Macro.postwalk(m, &do_get_info(&1))
    end)
  end

  def do_get_info({:defprotocol, _, [{:__aliases__, _, name}, [do: {:__block__, context, spec}]]}) do
    ElixirScript.State.add_protocol(name, {:__block__, context, spec})
  end

  def do_get_info({:defprotocol, _, [{:__aliases__, _, name}, [do: spec]]}) do
    ElixirScript.State.add_protocol(name, {:__block__, [], [spec]})
  end

  def do_get_info({:defimpl, _, [ {:__aliases__, _, protocol}, [for: type],  [do: {:__block__, context, spec}] ]}) when not protocol in @standard_lib_protocols do
    ElixirScript.State.add_protocol_impl(protocol, type, {:__block__, context, spec})
  end

  def do_get_info({:defimpl, _, [ {:__aliases__, _, protocol}, [for: type],  [do: spec] ]})  when not protocol in @standard_lib_protocols do
    ElixirScript.State.add_protocol_impl(protocol, type, {:__block__, [], [spec]})
  end

  def do_get_info({:defmodule, _, [{:__aliases__, _, [:ElixirScript, :Temp]}, [do: body]]} = ast) do
    body = case body do
      {:__block__, _, _ } ->
        Macro.expand(body, State.get().env)
      _ ->
        body
    end

    mod = %ElixirScript.Module{ name: [:ElixirScript, :Temp] , body: body }
    State.add_module(mod)

    ast
  end

  def do_get_info({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]} = ast) do
    body = make_inner_module_aliases(module_name_list, body)

    functions = get_functions_from_module(body)
    macros = get_macros_from_module(body)
    aliases = get_aliases_from_module(body)
    requires = get_requires_from_module(body)
    imports = get_imports_from_module(body)
    js_imports = get_js_imports_from_module(body)

    body = case body do
      {:__block__, _, _ } ->
        Macro.expand(body, State.get().env)
      _ ->
        body
    end

    aliases = Set.union(aliases, requires.aliases) |> Set.union(imports.aliases)

    mod = %ElixirScript.Module{ name: module_name_list, body: body,
    functions: functions, macros: macros,
    aliases: aliases, requires: requires.requires,
    imports: imports.imports, js_imports: js_imports }

    State.add_module(mod)

    ast
  end

  def do_get_info(ast) do
    ast
  end

  defp make_inner_module_aliases(module_name_list, body) do
    case body do
      nil ->
        { :__block__, [], [] }

      {:__block__, meta2, list2 } ->
        list2 = Enum.map(list2, fn(x) ->
          case x do
            {:defmodule, _, [{:__aliases__, _, module_name_list2}, [do: body2]]} ->
              body2 = make_inner_module_aliases(module_name_list2, body2)
              inner_alias = add_module_to_state(module_name_list, module_name_list2, body2)

              [
                inner_alias
              ]
            _ ->
              x
          end
        end)
        |> List.flatten

        {:__block__, meta2, list2}
      {:defmodule, _, [{:__aliases__, meta2, module_name_list2}, [do: body2]]} ->
        body2 = make_inner_module_aliases(module_name_list2, body2)
        inner_alias = add_module_to_state(module_name_list, module_name_list2, body2)

        {:__block__, meta2, [
            inner_alias
          ]
        }
      _ ->
        body
    end
  end

  defp add_module_to_state(module_name_list, module_name_list2, body2) do
    functions = get_functions_from_module(body2)
    macros = get_macros_from_module(body2)
    aliases = get_aliases_from_module(body2)
    requires = get_requires_from_module(body2)
    imports = get_imports_from_module(body2)
    js_imports = get_js_imports_from_module(body2)

    inner_alias = {:alias, [], [{:__aliases__, [alias: false], module_name_list ++ module_name_list2}]}
    {inner_alias_atom, _ } = Code.eval_quoted({:__aliases__, [alias: false], module_name_list ++ module_name_list2})

    aliases = Set.put(aliases, {inner_alias_atom, inner_alias_atom})
    aliases = Set.union(aliases, requires.aliases) |> Set.union(imports.aliases)

    mod = %ElixirScript.Module{ name: module_name_list2, body: body2,
    functions: functions, macros: macros, aliases: aliases,
    requires: requires.requires, imports: imports.imports, js_imports: js_imports }

    if State.module_listed?(module_name_list2) do
      State.delete_module(mod)
    end

    mod = %ElixirScript.Module{ name: module_name_list ++ module_name_list2, body: body2,
    functions: functions, macros: macros, aliases: aliases,
    requires: requires.requires }

    State.add_module(mod)

    inner_alias
  end


  defp get_functions_from_module({:__block__, _, list}) do
    Enum.reduce(list, Keyword.new, fn
      ({:def, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) ->
        arity = if is_nil(params), do: 0, else: length(params)

        unless Enum.member?(Keyword.get_values([], name), arity) do
          Keyword.put(state, name, arity);
        end

      ({:def, _, [{name, _, params}, [do: _body]]}, state) ->
        arity = if is_nil(params), do: 0, else: length(params)

        unless Enum.member?(Keyword.get_values([], name), arity) do
          Keyword.put(state, name, arity);
        end

      _, state ->
        state

    end)
  end

  defp get_functions_from_module(_) do
    Keyword.new
  end

  defp get_macros_from_module({:__block__, _, list}) do
    Enum.reduce(list, Keyword.new, fn
      ({:defmacro, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) ->
        arity = length(params)

        unless Enum.member?(Keyword.get_values([], name), arity) do
          Keyword.put(state, name, arity);
        end

      ({:defmacro, _, [{name, _, params}, [do: _body]]}, state) ->
        arity = length(params)

        unless Enum.member?(Keyword.get_values([], name), arity) do
          Keyword.put(state, name, arity);
        end

      _, state ->
        state
    end)
  end

  defp get_macros_from_module(_) do
    Keyword.new
  end


  defp get_aliases_from_module({:__block__, _, list}) do
    Enum.reduce(list, HashSet.new, fn
      ({:alias, _, [name]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })
        Set.put(state, {the_alias, main})
      ({:alias, _, [name, [as: the_alias]]}, state) ->
        {name, _} = Code.eval_quoted(name)
        {the_alias, _} = Code.eval_quoted(the_alias)

        Set.put(state, {the_alias, name})

      _, state ->
        state
    end)
  end


  defp get_aliases_from_module(_) do
    HashSet.new
  end


  defp get_requires_from_module({:__block__, _, list}) do
    Enum.reduce(list, %{ requires: HashSet.new, aliases: HashSet.new }, fn
      ({:require, _, [name]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })

        %{ state | requires: Set.put(state.requires, main), aliases: Set.put(state.aliases, {the_alias, main})  }
      ({:require, _, [name, [as: the_alias]]}, state) ->
        {name, _} = Code.eval_quoted(name)
        {the_alias, _} = Code.eval_quoted(the_alias)

        %{ state | requires: Set.put(state.requires, name), aliases: Set.put(state.aliases, {the_alias, name}) }

      _, state ->
        state
    end)
  end


  defp get_requires_from_module(_) do
    %{ requires: HashSet.new, aliases: HashSet.new }
  end


  defp get_imports_from_module({:__block__, _, list}) do
    Enum.reduce(list, %{ imports: HashSet.new, aliases: HashSet.new }, fn
      ({:import, _, [name]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })

        %{ state | imports: Set.put(state.imports, {main, []}), aliases: Set.put(state.aliases, {the_alias, main})  }

      ({:import, _, [name, options]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })

        %{ state | imports: Set.put(state.imports, {main, options}), aliases: Set.put(state.aliases, {the_alias, main})  }


      _, state ->
        state
    end)
  end


  defp get_imports_from_module(_) do
    %{ imports: HashSet.new, aliases: HashSet.new }
  end


  defp get_js_imports_from_module({:__block__, _, list}) do
    Enum.reduce(list, HashSet.new, fn
      ({{:., _, [{:__aliases__, _, [:JS]}, :import]}, _, [name, path]}, state) ->
        {name, _} = Code.eval_quoted(name)
        Set.put(state, {name, path})

      _, state ->
        state
    end)
  end


  defp get_js_imports_from_module(_) do
    HashSet.new
  end
end
