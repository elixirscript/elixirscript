defmodule ElixirScript.Passes.FindFunctions do
  @function_types [:def, :defp, :defgen, :defgenp, :defmacro, :defmacrop]

  def execute(data, _) do
    new_data = Enum.map(data.data, fn { module_name, module_data } ->

      %{def: functions, defp: private_functions, defgen: generators, defgenp: private_generators, defmacro: macros, defmacrop: private_macros } = get_functions_from_module(module_data.ast)

      module_data = Map.put(module_data, :functions, functions ++ generators)
      |> Map.put(:private_functions, private_functions ++ private_generators)
      |> Map.put(:macros, macros)
      |> Map.put(:private_macros, private_macros)

      {module_name, module_data}
    end)

    %{data | data: new_data}
  end

  defp get_functions_from_module({:__block__, _, list}) do
    Enum.reduce(list, new_function_map(), fn
      ({type, _, [{:when, _, [{name, _, params} | _guards] }, _] }, state) when type in @function_types and is_atom(params) ->
      arity = 0

      add_function_to_map(state, type, name, arity)

      ({type, _, [{:when, _, [{name, _, params} | _guards] }, _] }, state) when type in @function_types ->
      arity = if is_nil(params), do: 0, else: length(params)

      add_function_to_map(state, type, name, arity)

      ({type, _, [{name, _, params}, _]}, state) when type in @function_types and is_atom(params) ->
      arity = 0

      add_function_to_map(state, type, name, arity)

      ({type, _, [{name, _, params}, _]}, state) when type in @function_types ->
      arity = if is_nil(params), do: 0, else: length(params)
        add_function_to_map(state, type, name, arity)

      ({type, _, [{name, _, params}]}, state) when is_atom(params) and type in @function_types ->
      arity = 0
      add_function_to_map(state, type, name, arity)

      ({type, _, [{name, _, params}]}, state) when type in @function_types ->
      arity = length(params)
      add_function_to_map(state, type, name, arity)

    _, state ->
      state

    end)
  end

  defp new_function_map() do
    %{ def: Keyword.new, defp: Keyword.new, defgen: Keyword.new, defgenp: Keyword.new, defmacro: Keyword.new, defmacrop: Keyword.new }
  end

  defp get_functions_from_module(_) do
    new_function_map()
  end

  defp add_function_to_map(map, type, name, arity) do
    list = Map.get(map, type)

    if {name, arity} in list do
      map
    else
      Map.put(map, type, list ++ [{ name, arity }])
    end
  end


end
