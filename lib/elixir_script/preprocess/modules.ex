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
    body = make_inner_module_aliases(module_name_list, body)

    make_module(body, module_name_list)
    |> State.add_module

    ast
  end

  def do_get_info(ast) do
    ast
  end

  defp make_module(body, module_name_list) do
    body = case body do
      {:__block__, _, _ } ->
        Macro.expand(body, State.get().elixir_env)
      _ ->
        body
    end

    %{def: functions, defp: private_functions, defmacro: macros, defmacrop: private_macros } = get_functions_from_module(body)
    js_imports = get_js_imports_from_module(body)

    %ElixirScript.Module{ name: ElixirScript.Module.quoted_to_name({:__aliases__, [], module_name_list}) , body: body,
    functions: functions, private_functions: private_functions,
    macros: macros, private_macros: private_macros,
    js_imports: js_imports }
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
    %{def: functions, defp: private_functions, defmacro: macros, defmacrop: private_macros } = get_functions_from_module(body2)
    js_imports = get_js_imports_from_module(body2)

    inner_alias = {:alias, [], [{:__aliases__, [alias: false], module_name_list ++ module_name_list2}]}

    module_name = ElixirScript.Module.quoted_to_name({:__aliases__, [], tl(module_name_list) ++ module_name_list2})
    State.delete_module_by_name(module_name)

    module_name = ElixirScript.Module.quoted_to_name({:__aliases__, [], module_name_list ++ module_name_list2})

    mod = %ElixirScript.Module{ name: module_name, body: body2,
    functions: functions, private_functions: private_functions,
    macros: macros, private_macros: private_macros,
    js_imports: js_imports  }

    State.add_module(mod)

    inner_alias
  end


  defp get_functions_from_module({:__block__, _, list}) do
    Enum.reduce(list, %{ def: Keyword.new, defp: Keyword.new, defmacro: Keyword.new, defmacrop: Keyword.new }, fn
    ({type, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) when type in [:def, :defp] and is_atom(params) ->
      arity = 0

      add_function_to_map(state, type, name, arity)

    ({type, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) when type in [:def, :defp] ->
      arity = if is_nil(params), do: 0, else: length(params)

      add_function_to_map(state, type, name, arity)

    ({type, _, [{name, _, params}, [do: _body]]}, state) when type in [:def, :defp] and is_atom(params) ->
      arity = 0

      add_function_to_map(state, type, name, arity)


    ({type, _, [{name, _, params}, [do: _body]]}, state) when type in [:def, :defp] ->
      arity = if is_nil(params), do: 0, else: length(params)

      add_function_to_map(state, type, name, arity)

    ({type, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) when type in [:defmacro, :defmacrop] ->
      arity = length(params)

      add_function_to_map(state, type, name, arity)

    ({type, _, [{name, _, params}, [do: _body]]}, state)  when type in [:defmacro, :defmacrop]  ->
      arity = length(params)

      add_function_to_map(state, type, name, arity)

      _, state ->
        state

    end)
  end

  defp get_functions_from_module(_) do
    %{ def: Keyword.new, defp: Keyword.new, defmacro: Keyword.new, defmacrop: Keyword.new }
  end

  defp add_function_to_map(map, type, name, arity) do
    list = Map.get(map, type)

    if {name, arity} in list do
      map
    else
      Map.put(map, type, list ++ [{ name, arity }])
    end
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
end
