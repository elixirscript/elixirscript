defmodule ElixirScript.Passes.HandleOverridables do
  @moduledoc false

  def execute(compiler_data, opts) do
    new_data = Enum.map(compiler_data.data, fn { module_name, module_data } ->
      overridables = get_overridables(module_data.ast)
      ast = handle_overridable(module_data.ast, overridables)
      module_data = Map.put(module_data, :ast, ast)

      {module_name, module_data}
    end)

    Map.put(compiler_data, :data, new_data)  
  end

  defp get_overridables({:__block__, [], body}) do
    defover = Enum.find(body, fn 
      {:defoverridable, _, _} ->
        true
      _ ->
        false
    end)

    if is_nil(defover) do
      []
    else
      {:defoverridable, _, [overridables]} = defover
      overridables
    end
  end

  defp handle_overridable(ast, []) do
    ast
  end

  defp handle_overridable({:__block__, [], body}, overridables) do
    result = body
    |> Enum.reduce(%{overridables: [], overridable_found: false, body: []}, fn
      {:def, def_context, [{name, context, params}, function_body] } = ast, %{overridable_found: false} = acc ->
        Map.put(acc, :overridables, acc.overridables ++ [ast]) 

      {:defoverridable, _, _}, acc ->
        Map.put(acc, :overridable_found, true)
      x, acc ->
        Map.put(acc, :body, acc.body ++ [x])    
    end)

    processed_overridables = Enum.map(result.overridables, fn
      {:def, def_context, [{name, context, params}, function_body] } = ast ->
        arity = get_arity(params)

        found = Enum.any?(result.body, fn 
          {:def, _, [{name_from_body, _, params_from_body}, _] } ->
            if {name, arity} == {name_from_body, get_arity(params_from_body)} do
              true
            else
              false
            end
          _ ->
            false
        end)

        if found do
          super_name = String.to_atom("__super__" <> to_string(name))
          {:defp, def_context, [{super_name, context, params}, function_body] }
        else
          ast
        end
    end)

    body = processed_overridables ++ result.body
    {:__block__, [], body}
  end

  defp get_arity(params) do
    cond do
      is_nil(params) -> 
        0
      is_atom(params) -> 
        0
      true ->
        length(params)
    end    
  end
  
end