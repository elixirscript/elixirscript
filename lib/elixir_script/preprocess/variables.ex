defmodule ElixirScript.Preprocess.Variables do
  @moduledoc false

  @doc """
    Creates a new variable binding whenever an
    identifier is reused.

    ex.
      a = 1
      a = 2

      #becomes

      a0 = 1
      a1 = 2
  """
  def process(ast) do
    {new_ast, _ } = Macro.prewalk(ast, %{}, fn(x, acc) ->
      process_variables(x, acc)
    end)

    new_ast
  end

  def process_variables({:::, meta, [{{:., meta1, [Kernel, :to_string]}, meta2, params}, {:binary, meta3, context}]}, state) do
    params = Enum.map(params, fn(x) ->
      {value, _} = process_variables(x, state)
      value
    end)

    { {:::, meta, [{{:., meta1, [Kernel, :to_string]}, meta2, params}, {:binary, meta3, context}]}, state }
  end

  def process_variables({:=, meta, [{var1, var2}, value]}, state) do

    { value, _ } = process_variables(value, state)

    { [var1, var2], state } = Enum.map_reduce([var1, var2], state, fn(variable, current_state) ->
      update_variable_name_and_state(variable, current_state)
    end)

    { {:=, meta, [{var1, var2}, value]}, state }
  end

  def process_variables({:=, meta, [{:{}, meta2, variables}, value]}, state) do

    { value, _ } = process_variables(value, state)

    { variables, state } = Enum.map_reduce(variables, state, fn(variable, current_state) ->
      update_variable_name_and_state(variable, current_state)
    end)

    { {:=, meta, [{:{}, meta2, variables}, value]}, state }
  end

  def process_variables({:=, meta, [variables, value]}, state) when is_list(variables) do

    { value, _ } = process_variables(value, state)

    { variables, state } = Enum.map_reduce(variables, state, fn(variable, current_state) ->
      update_variable_name_and_state(variable, current_state)
    end)

    { {:=, meta, [variables, value]}, state }
  end

  def process_variables({:=, meta, [{variable_name, meta2, context}, value]}, state) when not(variable_name in [:%, :{}, :^, :&, :., :%{}]) do
    { value, _ } = process_variables(value, state)

    {new_variable_name, new_state} = get_new_variable_name(variable_name, state)
    { {:=, meta, [{new_variable_name, meta2, context}, value]}, new_state }
  end

  def process_variables({:<<>>, meta, params}, state) do
     params = Enum.map(params, fn(x) ->
      {value, _} = process_variables(x, state)
      value
    end)

    { {:<<>>, meta, params}, state }
  end

  def process_variables({{:., meta, [{:__aliases__, context, module}, function]}, meta2, params}, state) do
    params = Enum.map(params, fn(x) ->
      {value, _} = process_variables(x, state)
      value
    end)

    { {{:., meta, [{:__aliases__, context, module}, function]}, meta2, params}, state }
  end

  def process_variables({{:., meta, [variable, function]}, meta2, params}, state) do
    {variable, _} = process_variables(variable, state)

    params = Enum.map(params, fn(x) ->
      {value, _} = process_variables(x, state)
      value
    end)

    { {{:., meta, [variable, function]}, meta2, params}, state }
  end

  def process_variables(variables, state) when is_list(variables) do
     variables = Enum.map(variables, fn(x) ->
      {value, _} = process_variables(x, state)
      value
    end)

    { variables, state }
  end

  def process_variables({variable_name, meta, context}, state) do
    cond do
      Map.has_key?(state, variable_name) ->
        new_variable_name = String.to_atom("#{variable_name}#{Map.get(state, variable_name)}")
        { {new_variable_name, meta, context}, state }
      true ->
        { {variable_name, meta, context}, state }
    end
  end

  def process_variables(ast, state) do
    { ast, state }
  end

  defp get_new_variable_name(variable_name, state) do
    current = Map.get(state, variable_name, -1) + 1
    new_variable_name = String.to_atom("#{variable_name}#{current}")
    new_state = Map.put(state, variable_name, current)

    { new_variable_name, new_state }
  end

  defp update_variable_name_and_state(variable, current_state) do
    case variable do
      {variable_name, context, params} when not(variable_name in [:%, :{}, :^, :&, :_, :%{}]) ->
        {new_variable_name, new_state} = get_new_variable_name(variable_name, current_state)
        { {new_variable_name, context, params} , new_state }
      _ ->
        {variable, current_state}
    end
  end

end
