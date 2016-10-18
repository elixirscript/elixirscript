defmodule ElixirScript.Passes.FindFunctions do
  @pass 6
  @function_types [:def, :defp, :defgen, :defgenp]

  def execute(data, opts) do
    new_data = Enum.map(data.data, fn { module_name, module_data } ->

      %{def: functions, defp: private_functions, defgen: generators, defgenp: private_generators } = case module_data.ast do
        {:defmodule, _, [_, [do: body]]} ->
          get_functions_from_module(body)
        {:defprotocol, _, [_, [do: {:__block__, _, _} = block]]} ->
          get_functions_from_module(block)
        {:defprotocol, _, [{:__aliases__, _, _} = the_alias, [do: spec]]} ->
          get_functions_from_module({:__block__, [], [spec]})
        _ ->
          %{ def: Keyword.new, defp: Keyword.new, defgen: Keyword.new, defgenp: Keyword.new }
      end


      module_data = Map.put(module_data, :functions, functions ++ generators)
      |> Map.put(:private_functions, private_functions ++ private_generators)

      {module_name, module_data}
    end)

    %{data | data: new_data}
  end

  defp get_functions_from_module({:__block__, _, list}) do
    Enum.reduce(list, %{ def: Keyword.new, defp: Keyword.new, defgen: Keyword.new, defgenp: Keyword.new }, fn
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

  defp get_functions_from_module(_) do
    %{ def: Keyword.new, defp: Keyword.new }
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
