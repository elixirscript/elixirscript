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
    mod = %ElixirScript.Module{ name: [:ElixirScript, :Temp] , body: body }
    State.add_module(mod)

    ast
  end

  def do_get_info({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]} = ast) do
    body = make_inner_module_aliases(module_name_list, body)

    functions = get_functions_from_module(body)
    macros = get_macros_from_module(body)

    body = case body do
      {:__block__, _, _ } ->
        Macro.expand(body, State.get().env)
      _ ->
        body
    end

    mod = %ElixirScript.Module{ name: module_name_list , body: body, functions: functions, macros: macros }
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
            {:defmodule, meta1, [{:__aliases__, _, module_name_list2}, [do: body2]]} ->
              body2 = make_inner_module_aliases(module_name_list2, body2)

              functions = get_functions_from_module(body2)
              macros = get_macros_from_module(body2)

              mod = %ElixirScript.Module{ name: module_name_list2, body: body2, functions: functions, macros: macros }

              if State.module_listed?(module_name_list2) do
                State.delete_module(mod)
              end

              mod = %ElixirScript.Module{ name: module_name_list ++ module_name_list2, body: body2, functions: functions, macros: macros }
              State.add_module(mod)

              [
                {:alias, meta1, [{:__aliases__, [alias: false], module_name_list ++ module_name_list2}]}
              ]
            _ ->
              x
          end
        end)
        |> List.flatten

        {:__block__, meta2, list2}
      {:defmodule, meta1, [{:__aliases__, meta2, module_name_list2}, [do: body2]]} ->
        body2 = make_inner_module_aliases(module_name_list2, body2)

        functions = get_functions_from_module(body2)
        macros = get_macros_from_module(body2)

        mod = %ElixirScript.Module{ name: module_name_list2, body: body2, functions: functions, macros: macros }

        if State.module_listed?(module_name_list2) do
          State.delete_module(mod)
        end

        mod = %ElixirScript.Module{ name: module_name_list ++ module_name_list2, body: body2, functions: functions, macros: macros }
        State.add_module(mod)

        {:__block__, meta2, [
            {:alias, meta1, [{:__aliases__, [alias: false], module_name_list ++ module_name_list2}]}
          ]
        }
      _ ->
        body
    end
  end


  defp get_functions_from_module({:__block__, _, list}) do
    Enum.reduce(list, HashSet.new, fn
      ({:def, _, [{:when, _, [{name, _, _params} | _guards] }, [do: _body]] }, state) ->
        Set.put(state, name)
      ({:def, _, [{name, _, _params}, [do: _body]]}, state) ->
        Set.put(state, name)
      _, state ->
        state
    end)
  end

  defp get_functions_from_module(_) do
    []
  end

  defp get_macros_from_module({:__block__, _, list}) do
    Enum.reduce(list, HashSet.new, fn
      ({:defmacro, _, [{:when, _, [{name, _, params} | guards] }, [do: body]] }, state) ->
        macro = %ElixirScript.Macro{ name: name, parameters: params, body: body, guard: guards }
        Set.put(state, macro)

      ({:defmacro, _, [{name, _, params}, [do: body]]}, state) ->
        macro = %ElixirScript.Macro{ name: name, parameters: params, body: body }
        Set.put(state, macro)

      _, state ->
        state
    end)
  end

  defp get_macros_from_module({:defmacro, _, [{:when, _, [{name, _, params} | guards] }, [do: body]] }) do
    state = HashSet.new
    macro = %ElixirScript.Macro{ name: name, parameters: params, body: body, guard: guards }
    Set.put(state, macro)
  end

  defp get_macros_from_module({:defmacro, _, [{name, _, params}, [do: body]]}) do
    state = HashSet.new
    macro = %ElixirScript.Macro{ name: name, parameters: params, body: body }
    Set.put(state, macro)
  end

  defp get_macros_from_module(_) do
    []
  end
end
