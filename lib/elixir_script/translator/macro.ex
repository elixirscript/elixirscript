defmodule ElixirScript.Translator.Macro do

  def expand(macro, macro_param_values) do

    {ast, _} = Macro.prewalk(macro.body, %{ parameters: macro.parameters, bound: [] }, fn
      {:unquote, _, [x]}, macro_params ->
        { translate_variable(x, macro_params.parameters, macro_param_values), macro_params }
      {:quote, _, [[do: ast ]]}, macro_params ->
        { ast, macro_params }

      {:quote, _, [ [bind_quoted: bound_variables], [do: ast ] ]}, macro_params ->
        bound_params = Enum.reduce(bound_variables, [], fn({key, value}, state) ->

          macro_param = Enum.find(macro_params.parameters, fn({key2, _, _}) -> key2 == elem(value, 0) end)

          if(macro_param) do
            [{ key, elem(value, 1), elem(value, 2) }] ++ state
          else
            state
          end

        end)

        bound_params = %{ macro_params | bound: bound_params }

        { ast,  bound_params }
      x, macro_params ->
        { translate_variable(x, macro_params.bound, macro_param_values), macro_params }

    end)

    ast
  end

  defp translate_variable(x, macro_params, macro_param_values) do
    index = Enum.find_index(macro_params, fn(y) -> x == y end)

    if(index) do
      Enum.fetch!(macro_param_values, index)
    else
      x
    end
  end

end
