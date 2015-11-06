defmodule ElixirScript.Translator.Macro do
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Function

  def expand_using( %ElixirScript.Macro{ name: :__using__ } = macro, macro_param_values) do
    do_expand(macro, macro_param_values)
  end

  def expand(macro, macro_param_values, env) do
    do_expand(macro, macro_param_values)
    |> Function.make_function_body(env)
    |> Utils.wrap_in_function_closure
  end

  defp do_expand(macro, macro_param_values) do
    Macro.prewalk(macro.body, %{ parameters: macro.parameters, bound: [] }, fn
      {:unquote, _, [x]}, macro_params ->
        { translate_variable(x, macro_params.parameters, macro_param_values), macro_params }

      {:unquote_splicing, _, elements }, macro_params ->
        { Enum.map(elements, &translate_variable(&1, macro_params.parameters, macro_param_values)), macro_params }

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
    |> elem(0)
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
