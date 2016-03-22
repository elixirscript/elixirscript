defmodule ElixirScript.Translator.ModuleCollector do
  @moduledoc false

  # This module is responsible for
  # taking the compiler input and parsing out any modules found
  # These modules are then added to ElixirScript.Translator.State

  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def process_modules(modules) do
    Enum.map(modules, fn
      { :__block__, _, list } ->
        {modules, not_modules} = Enum.partition(list,
                                                fn
                                                  {type, _, _ } when type in [:defprotocol, :defimpl, :defmodule] ->
                                                    true
                                                  _ ->
                                                    false
                                                end)

      temp_module = case not_modules do
                      [] ->
                        []
                      _ ->
                        [{:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], not_modules }]]}]
                    end

      modules ++ temp_module

      {type, _, _ } = x when type in [:defprotocol, :defimpl, :defmodule] ->
        x
      x ->
        {:defmodule, [], [{:__aliases__, [], [:ElixirScript, :Temp]}, [do: { :__block__, [], [x] }]]}
    end)
    |> List.flatten
    |> Enum.each(fn(m) ->
      Macro.postwalk(m, &do_process_modules(&1))
    end)
  end

  def do_process_modules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: {:__block__, _, _} = block]]}) do
    %{def: functions, defp: _, defmacro: _, defmacrop: _ } = get_functions_from_module(block)
    ElixirScript.Translator.State.add_protocol(Utils.quoted_to_name(the_alias), functions)
  end

  def do_process_modules({:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: spec]]}) do
    %{def: functions, defp: _, defmacro: _, defmacrop: _ } = get_functions_from_module({:__block__, [], [spec]})
    ElixirScript.Translator.State.add_protocol(Utils.quoted_to_name(the_alias), functions)
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

  def do_process_modules({:defmodule, _, [{:__aliases__, _, _}, [do: _]]} = ast) do
    do_module_processing(ast)
    ast
  end

  def do_process_modules(ast) do
    ast
  end

  defp do_module_processing({:defmodule, _, [{:__aliases__, _, name}, [do: body]]}) do
    { body, inner_modules } = make_inner_module_aliases(name, body)

    aliases = Enum.map(inner_modules, fn
      ({:defmodule, _, [{:__aliases__, _, inner_module_name}, [do: inner_module_body]]}) ->
        { :alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}, [as: {:__aliases__, [alias: false], inner_module_name }] ] }
    end)

    Enum.each(inner_modules, fn
      ({:defmodule, context1, [{:__aliases__, context2, inner_module_name}, [do: inner_module_body]]}) ->

        module_name = Utils.quoted_to_name({:__aliases__, [], tl(name) ++ inner_module_name})
        State.delete_module_by_name(module_name)

        this_module_aliases = aliases -- [{ :alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}, [as: {:__aliases__, [alias: false], inner_module_name }] ] }]

        {:defmodule, context1, [{:__aliases__, context2, name ++ inner_module_name}, [do: add_aliases_to_body(inner_module_body, this_module_aliases)]]}
        |> do_module_processing
    end)

    module = make_module(add_aliases_to_body(body, aliases), name)
    State.add_module(module)
  end

  defp add_aliases_to_body(body, aliases) do
    case body do
      { :__block__, context, body } ->
        { :__block__, context, aliases ++ List.wrap(body) }
      _ ->
        { :__block__, [], aliases ++ List.wrap(body) }
    end
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

  defp add_module_to_state(name, inner_module_name, inner_module_body) do
    %{def: functions, defp: private_functions, defmacro: macros, defmacrop: private_macros } = get_functions_from_module(inner_module_body)
    js_imports = get_js_imports_from_module(inner_module_body)

    inner_alias = { :alias, [], [{:__aliases__, [alias: false], name ++ inner_module_name}] }

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
    ({type, _, [{:when, _, [{name, _, params} | _guards] }, _] }, state) when type in [:def, :defp] and is_atom(params) ->
      arity = 0

      add_function_to_map(state, type, name, arity)

    ({type, _, [{:when, _, [{name, _, params} | _guards] }, _] }, state) when type in [:def, :defp] ->
      arity = if is_nil(params), do: 0, else: length(params)

      add_function_to_map(state, type, name, arity)

    ({type, _, [{name, _, params}, _]}, state) when type in [:def, :defp] and is_atom(params) ->
      arity = 0

      add_function_to_map(state, type, name, arity)


    ({type, _, [{name, _, params}, _]}, state) when type in [:def, :defp] ->
      arity = if is_nil(params), do: 0, else: length(params)
        add_function_to_map(state, type, name, arity)

    ({type, _, [{:when, _, [{name, _, params} | _guards] }, [do: _body]] }, state) when type in [:defmacro, :defmacrop] ->
      arity = length(params)

      add_function_to_map(state, type, name, arity)

    ({type, _, [{name, _, nil}, [do: _body]]}, state)  when type in [:defmacro, :defmacrop]  ->
      add_function_to_map(state, type, name, 0)


    ({type, _, [{name, _, params}, [do: _body]]}, state)  when type in [:defmacro, :defmacrop]  ->
      arity = length(params)

      add_function_to_map(state, type, name, arity)

    ({type, _, [{name, _, params}]}, state) when is_atom(params) and type in [:def, :defp] ->
      arity = 0
      add_function_to_map(state, type, name, arity)

    ({type, _, [{name, _, params}]}, state) when type in [:def, :defp] ->
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
