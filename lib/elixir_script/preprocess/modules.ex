defmodule ElixirScript.Preprocess.Modules do
  @moduledoc false

  alias ElixirScript.State

  def get_info(modules) do
    Enum.each(modules, fn(m) ->
      Macro.postwalk(m, fn(x) ->
        do_get_info(x)
      end)
    end)
  end

  def do_get_info({:defprotocol, _, [{:__aliases__, _, name}, [do: {:__block__, context, spec}]]}) do
    ElixirScript.State.add_protocol(name, {:__block__, context, spec})
  end

  def do_get_info({:defprotocol, _, [{:__aliases__, _, name}, [do: spec]]}) do
    ElixirScript.State.add_protocol(name, {:__block__, [], [spec]})
  end

  def do_get_info({:defimpl, _, [ {:__aliases__, _, protocol}, [for: type],  [do: {:__block__, context, spec}] ]}) do
    ElixirScript.State.add_protocol_impl(protocol, type, {:__block__, context, spec})
  end

  def do_get_info({:defimpl, _, [ {:__aliases__, _, protocol}, [for: type],  [do: spec] ]}) do
    ElixirScript.State.add_protocol_impl(protocol, type, {:__block__, [], [spec]})
  end

  def do_get_info({:defmodule, _, [{:__aliases__, meta, module_name_list}, [do: body]]} = ast) do
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


  defp get_functions_from_module({:__block__, meta, list}) do
    Enum.reduce(list, HashSet.new, fn
      ({:def, _, [{:when, _, [{name, _, _params} | _guards] }, [do: _body]] }, state) ->
        Set.put(state, name)
      ({:def, _, [{name, _, _params}, [do: _body]]}, state) ->
        Set.put(state, name)
      _, state ->
        state
    end)
  end

  defp get_functions_from_module(ast) do
    []
  end

  defp get_macros_from_module({:__block__, meta, list}) do
    Enum.reduce(list, HashSet.new, fn
      ({:defmacro, _, [{:when, _, [{name, _, _params} | _guards] }, [do: _body]] }, state) ->
        Set.put(state, name)
      ({:defmacro, _, [{name, _, _params}, [do: _body]]}, state) ->
        Set.put(state, name)
      _, state ->
        state
    end)
  end

  defp get_macros_from_module(ast) do
    []
  end
end