defmodule ElixirScript.Preprocess.Modules do
  @moduledoc false

  alias ElixirScript.State

  def get_info(modules) do
    Enum.map(modules, fn
      { :__block__, _, list } ->
        {mods, no_mods} = Enum.partition(list, fn
          ({:defprotocol, _, _ }) ->
            true
          ({:defimpl, _, _ }) ->
            true
          ({:defmodule, _, _}) ->
            true
          _ ->
            false
        end)

        mods ++ [{:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], no_mods }]]}]
      ({:defprotocol, _, _ }) = x ->
        x
      ({:defimpl, _, _}) = x ->
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

  def do_get_info({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: {:__block__, context, spec}]]}) do
    ElixirScript.State.add_protocol(ElixirScript.Module.quoted_to_name(the_alias), {:__block__, context, spec})
  end

  def do_get_info({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: spec]]}) do
    ElixirScript.State.add_protocol(ElixirScript.Module.quoted_to_name(the_alias), {:__block__, [], [spec]})
  end

  def do_get_info({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  [do: {:__block__, context, spec}] ]}) do
    ElixirScript.State.add_protocol_impl(ElixirScript.Module.quoted_to_name(the_alias), type, {:__block__, context, spec})
  end

  def do_get_info({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  [do: spec] ]}) do
    ElixirScript.State.add_protocol_impl(ElixirScript.Module.quoted_to_name(the_alias), type, {:__block__, [], [spec]})
  end

  def do_get_info({:defmodule, _, [{:__aliases__, _, [:ElixirScript, :Temp]}, [do: body]]} = ast) do
    body
    |> make_module([:ElixirScript, :Temp])
    |> State.add_module

    ast
  end

  def do_get_info({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]} = ast) do
    make_inner_module_aliases(module_name_list, body)
    |> make_module(module_name_list)
    |> State.add_module

    ast
  end

  def do_get_info(ast) do
    ast
  end

  defp make_module(body, module_name_list) do
    body = case body do
      {:__block__, _, _ } ->
        Macro.expand(body, State.get().env)
      _ ->
        body
    end

    functions = get_functions_from_module(body)
    macros = get_macros_from_module(body)
    aliases = get_aliases_from_module(body)
    requires = get_requires_from_module(body)
    imports = get_imports_from_module(body)
    js_imports = get_js_imports_from_module(body)

    aliases = MapSet.union(aliases, requires.aliases) |> MapSet.union(imports.aliases)
    %ElixirScript.Module{ name: ElixirScript.Module.quoted_to_name({:__aliases__, [], module_name_list}) , body: body,
    functions: functions, macros: macros,
    aliases: aliases, requires: requires.requires,
    imports: imports.imports, js_imports: js_imports }
  end

  defp make_inner_module_aliases(module_name_list, body) do
    case body do
      nil ->
        { :__block__, [], [] }

      {:__block__, meta2, list2 } ->
        list2 = Enum.map(list2, fn(x) ->
          case x do
            {:defmodule, _, [{:__aliases__, _, module_name_list2}, [do: body2]]} ->
              body2 = make_inner_module_aliases( module_name_list ++ module_name_list2, body2)
              inner_alias = add_module_to_state(module_name_list, module_name_list2, body2)


              [ inner_alias ]
            _ ->
              x
          end
        end)
        |> List.flatten

        {:__block__, meta2, list2}
      {:defmodule, _, [{:__aliases__, meta2, module_name_list2}, [do: body2]]} ->
        body2 = make_inner_module_aliases(module_name_list ++ module_name_list2, body2)
        inner_alias = add_module_to_state(module_name_list, module_name_list2, body2)

        {:__block__, meta2, [ inner_alias ] }
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

    aliases = MapSet.put(aliases, {inner_alias_atom, inner_alias_atom})
    aliases = MapSet.union(aliases, requires.aliases) |> MapSet.union(imports.aliases)

    module_name = ElixirScript.Module.quoted_to_name({:__aliases__, [], tl(module_name_list) ++ module_name_list2})
    State.delete_module_by_name(module_name)

    module_name = ElixirScript.Module.quoted_to_name({:__aliases__, [], module_name_list ++ module_name_list2})

    mod = %ElixirScript.Module{ name: module_name, body: body2,
    functions: functions, macros: macros, aliases: aliases,
    requires: requires.requires, js_imports: js_imports  }

    State.add_module(mod)

    inner_alias
  end


  defp get_functions_from_module({:__block__, _, list}) do
    Enum.reduce(list, Keyword.new, fn
    ({:def, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) when is_atom(params) ->
      arity = 0

      unless Enum.member?(Keyword.get_values([], name), arity) do
        Keyword.put(state, name, arity);
      end

    ({:def, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) ->
      arity = if is_nil(params), do: 0, else: length(params)

      unless Enum.member?(Keyword.get_values([], name), arity) do
        Keyword.put(state, name, arity);
      end

    ({:def, _, [{name, _, params}, [do: _body]]}, state) when is_atom(params) ->
      arity = 0

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
    Enum.reduce(list, build_standard_aliases(), fn
      ({:alias, _, [name]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })
        MapSet.put(state, {the_alias, main})
      ({:alias, _, [name, [as: the_alias]]}, state) ->
        {name, _} = Code.eval_quoted(name)
        {the_alias, _} = Code.eval_quoted(the_alias)

        MapSet.put(state, {the_alias, name})

      _, state ->
        state
    end)
  end


  defp get_aliases_from_module(_) do
    MapSet.new
  end


  defp get_requires_from_module({:__block__, _, list}) do
    Enum.reduce(list, %{ requires: MapSet.new, aliases: MapSet.new }, fn
      ({:require, _, [name]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })

        %{ state | requires: MapSet.put(state.requires, main), aliases: MapSet.put(state.aliases, {the_alias, main})  }
      ({:require, _, [name, [as: the_alias]]}, state) ->
        {name, _} = Code.eval_quoted(name)
        {the_alias, _} = Code.eval_quoted(the_alias)

        %{ state | requires: MapSet.put(state.requires, name), aliases: MapSet.put(state.aliases, {the_alias, name}) }

      _, state ->
        state
    end)
  end


  defp get_requires_from_module(_) do
    %{ requires: MapSet.new, aliases: MapSet.new }
  end


  defp get_imports_from_module({:__block__, _, list}) do
    Enum.reduce(list, %{ imports: MapSet.new |> MapSet.put({ ElixirScript.Kernel, [] }), aliases: MapSet.new }, fn
      ({:import, _, [name]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })

        %{ state | imports: MapSet.put(state.imports, {main, []}), aliases: MapSet.put(state.aliases, {the_alias, main})  }

      ({:import, _, [name, options]}, state) ->
        {main, _} = Code.eval_quoted(name)
        {:__aliases__, _, aliases } = name
        {the_alias, _} = Code.eval_quoted({:__aliases__, [alias: false], List.last(aliases) |> List.wrap })

        %{ state | imports: MapSet.put(state.imports, {main, options}), aliases: MapSet.put(state.aliases, {the_alias, main})  }


      _, state ->
        state
    end)
  end


  defp get_imports_from_module(_) do
    %{ imports: MapSet.new, aliases: MapSet.new }
  end


  defp get_js_imports_from_module({:__block__, _, list}) do
    Enum.reduce(list, MapSet.new, fn
      ({{:., _, [{:__aliases__, _, [:JS]}, :import]}, _, [name, path]}, state) ->
        {name, _} = Code.eval_quoted(name)
        MapSet.put(state, {name, path})

      _, state ->
        state
    end)
  end


  defp get_js_imports_from_module(_) do
    MapSet.new
  end


  defp build_standard_aliases() do
    MapSet.new
    |> MapSet.put({ Kernel, ElixirScript.Kernel })
    |> MapSet.put({ Tuple, ElixirScript.Tuple })
    |> MapSet.put({ Atom, ElixirScript.Atom })
    |> MapSet.put({ Collectable, ElixirScript.Collectable })
    |> MapSet.put({ String.Chars, ElixirScript.String.Chars })
    |> MapSet.put({ Enumerable, ElixirScript.Enumerable })
    |> MapSet.put({ Integer, ElixirScript.Integer })
  end
end
