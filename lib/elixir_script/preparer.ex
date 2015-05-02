defmodule ElixirScript.Preparer do
  @moduledoc """
  Prepares the AST before translation starts
  """

  @doc """
    Handles any changes to ast before translate starts.
  """
  def prepare(ast) do
    {new_ast, _ } = Macro.prewalk(ast, %{}, fn(x, acc) ->
      prepare_variables(x, acc)
    end)

    new_ast
  end

  def prepare_variables({:::, meta, [{{:., meta1, [Kernel, :to_string]}, meta2, params}, {:binary, meta3, context}]}, state) do
    params = Enum.map(params, fn(x) ->
      {value, _} = prepare_variables(x, state)
      value
    end)

    { {:::, meta, [{{:., meta1, [Kernel, :to_string]}, meta2, params}, {:binary, meta3, context}]}, state }
  end

  def prepare_variables({:=, meta, [{var1, var2}, value]}, state) do

    { value, _ } = prepare_variables(value, state)

    { [var1, var2], state } = Enum.map_reduce([var1, var2], state, fn(x, current_state) ->
      case x do
        {variable_name, meta2, context} when not(variable_name in [:%, :{}, :^, :&]) ->
          {new_variable_name, new_state} = get_new_variable_name(variable_name, current_state)
          { {new_variable_name, meta2, context} , new_state }
        _ ->
          {x, current_state}
      end
    end)

    { {:=, meta, [{var1, var2}, value]}, state }
  end

  def prepare_variables({:=, meta, [{:{}, meta2, variables}, value]}, state) do

    { value, _ } = prepare_variables(value, state)

    { variables, state } = Enum.map_reduce(variables, state, fn(x, current_state) ->
      case x do
        {variable_name, meta3, context} when not(variable_name in [:%, :{}, :^, :&, :_]) ->
          {new_variable_name, new_state} = get_new_variable_name(variable_name, current_state)
          { {new_variable_name, meta3, context} , new_state }
        _ ->
          {x, current_state}
      end
    end)

    { {:=, meta, [{:{}, meta2, variables}, value]}, state }
  end

  def prepare_variables({:=, meta, [variables, value]}, state) when is_list(variables) do

    { value, _ } = prepare_variables(value, state)

    { variables, state } = Enum.map_reduce(variables, state, fn(x, current_state) ->
      case x do
        {variable_name, meta3, context} when not(variable_name in [:%, :{}, :^, :&, :_]) ->
          {new_variable_name, new_state} = get_new_variable_name(variable_name, current_state)
          { {new_variable_name, meta3, context} , new_state }
        _ ->
          {x, current_state}
      end
    end)

    { {:=, meta, [variables, value]}, state }
  end

  def prepare_variables({:=, meta, [{variable_name, meta2, context}, value]}, state) when not(variable_name in [:%, :{}, :^, :&, :.]) do
    { value, _ } = prepare_variables(value, state)

    {new_variable_name, new_state} = get_new_variable_name(variable_name, state)
    { {:=, meta, [{new_variable_name, meta2, context}, value]}, new_state }
  end

  def prepare_variables({:<<>>, meta, params}, state) do
     params = Enum.map(params, fn(x) ->
      {value, _} = prepare_variables(x, state)
      value
    end)
    
    { {:<<>>, meta, params}, state }
  end  

  def prepare_variables({{:., meta, [{:__aliases__, context, module}, function]}, meta2, params}, state) do
    params = Enum.map(params, fn(x) ->
      {value, _} = prepare_variables(x, state)
      value
    end)

    { {{:., meta, [{:__aliases__, context, module}, function]}, meta2, params}, state }
  end

  def prepare_variables({{:., meta, [variable, function]}, meta2, params}, state) do
    {variable, _} = prepare_variables(variable, state)

    params = Enum.map(params, fn(x) ->
      {value, _} = prepare_variables(x, state)
      value
    end)

    { {{:., meta, [variable, function]}, meta2, params}, state }
  end

  def prepare_variables(variables, state) when is_list(variables) do
     variables = Enum.map(variables, fn(x) ->
      {value, _} = prepare_variables(x, state)
      value
    end)
    
    { variables, state }   
  end

  def prepare_variables({variable_name, meta, context}, state) do
    cond do
      Map.has_key?(state, variable_name) ->
        new_variable_name = String.to_atom("#{variable_name}#{Map.get(state, variable_name)}")
        { {new_variable_name, meta, context}, state }
      true ->
        { {variable_name, meta, context}, state }
    end
  end

  def prepare_variables(ast, state) do
    { ast, state }
  end

  defp get_new_variable_name(variable_name, state) do
    current = Map.get(state, variable_name, -1) + 1
    new_variable_name = String.to_atom("#{variable_name}#{current}")
    new_state = Map.put(state, variable_name, current)

    { new_variable_name, new_state }
  end
  
end