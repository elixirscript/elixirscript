defmodule ElixirScript.Preprocess.Modules do
  @moduledoc false

  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def process_modules(modules) do
    Enum.map(modules, fn
      { :__block__, _, list } ->
        {modules, not_modules} = Enum.partition(list, fn
          ({:defprotocol, _, _ }) ->
            true
          ({:defimpl, _, _ }) ->
            true
          ({:defmodule, _, _}) ->
            true
          _ ->
            false
        end)

        temp_module = [{:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], not_modules }]]}]
        modules ++ temp_module
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
      Macro.postwalk(m, &do_process_modules(&1))
    end)
  end

  def do_process_modules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: {:__block__, context, spec}]]}) do
    ElixirScript.Translator.State.add_protocol(Utils.quoted_to_name(the_alias), {:__block__, context, spec})
  end

  def do_process_modules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: spec]]}) do
    ElixirScript.Translator.State.add_protocol(Utils.quoted_to_name(the_alias), {:__block__, [], [spec]})
  end

  def do_process_modules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  [do: {:__block__, context, spec}] ]}) do
    ElixirScript.Translator.State.add_protocol_impl(Utils.quoted_to_name(the_alias), type, {:__block__, context, spec})
  end

  def do_process_modules({:defimpl, _, [ {:__aliases__, _, _} = the_alias, [for: type],  [do: spec] ]}) do
    ElixirScript.Translator.State.add_protocol_impl(Utils.quoted_to_name(the_alias), type, {:__block__, [], [spec]})
  end

  def do_process_modules({:defmodule, _, [{:__aliases__, _, [:ElixirScript, :Temp]}, [do: body]]} = ast) do
    body
    |> make_module([:ElixirScript, :Temp])
    |> State.add_module

    ast
  end

  def do_process_modules({:defmodule, _, [{:__aliases__, _, name}, [do: body]]} = ast) do
    body = make_inner_module_aliases(name, body)

    make_module(body, name)
    |> State.add_module

    ast
  end

  def do_process_modules(ast) do
    ast
  end

  defp make_module(body, name) do
    body = case body do
      {:__block__, _, _ } ->
        Macro.expand(body, State.get().compiler_opts.env)
      _ ->
        body
    end

    %{def: functions, defp: private_functions, defmacro: macros, defmacrop: private_macros } = get_functions_from_module(body)
    js_imports = get_js_imports_from_module(body)

    %ElixirScript.Module{ name: Utils.quoted_to_name({:__aliases__, [], name}) , body: body,
    functions: functions, private_functions: private_functions,
    macros: macros, private_macros: private_macros,
    js_imports: js_imports }
  end

  defp make_inner_module_aliases(name, body) do
    case body do
      nil ->
        { :__block__, [], [] }

      {:__block__, context, list2 } ->
        list2 = Enum.map(list2, fn(x) ->
          case x do
            {:defmodule, _, [{:__aliases__, _, inner_module_name}, [do: inner_module_body]]} ->
              inner_module_body = make_inner_module_aliases( name ++ inner_module_name, inner_module_body)
              inner_alias = add_module_to_state(name, inner_module_name, inner_module_body)


              [ inner_alias ]
            _ ->
              x
          end
        end)
        |> List.flatten

        {:__block__, context, list2}
      {:defmodule, _, [{:__aliases__, context, inner_module_name}, [do: inner_module_body]]} ->
        inner_module_body = make_inner_module_aliases(name ++ inner_module_name, inner_module_body)
        inner_alias = add_module_to_state(name, inner_module_name, inner_module_body)

        {:__block__, context, [ inner_alias ] }
      _ ->
        body
    end
  end

  defp add_module_to_state(name, inner_module_name, inner_module_body) do
    %{def: functions, defp: private_functions, defmacro: macros, defmacrop: private_macros } = get_functions_from_module(inner_module_body)
    js_imports = get_js_imports_from_module(inner_module_body)

    inner_alias = {:alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}]}

    module_name = Utils.quoted_to_name({:__aliases__, [], tl(name) ++ inner_module_name})
    State.delete_module_by_name(module_name)

    module_name = Utils.quoted_to_name({:__aliases__, [], name ++ inner_module_name})

    mod = %ElixirScript.Module{ name: module_name, body: inner_module_body,
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
