defmodule ElixirScript.Translator do
  require Logger
  alias ElixirScript.Translator.Primative
  alias ElixirScript.Translator.PatternMatching
  alias ElixirScript.Translator.Data
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Expression
  alias ElixirScript.Translator.Import
  alias ElixirScript.Translator.Control
  alias ElixirScript.Translator.Module
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Kernel, as: ExKernel

  @doc """
    Handles any changes to ast before translate starts.
  """
  def prepare_ast(ast) do
    #TODO: Check Assignment for former previous value
    # ie: a = a -> let a1 = a0

    {new_ast, _ } = Macro.prewalk(ast, %{}, fn(x, acc) ->
      prepare_variables(x, acc)
    end)

    new_ast
  end

  def prepare_variables({:=, meta, [{var1, var2}, value]}, state) do

    { [var1, var2], state } = Enum.map_reduce([var1, var2], state, fn(x, current_state) ->
      case x do
        {variable_name, meta2, context} when not(variable_name in [:%, :{}, :^, :&]) ->
          {new_variable_name, new_state} = get_new_variable_name(variable_name, state)
          { {new_variable_name, meta2, context} , new_state }
        _ ->
          {x, current_state}
      end
    end)

    { {:=, meta, [{var1, var2}, value]}, state }
  end

  def prepare_variables({:=, meta, [{:{}, meta2, variables}, value]}, state) do

    { variables, state } = Enum.map_reduce(variables, state, fn(x, current_state) ->
      case x do
        {variable_name, meta3, context} when not(variable_name in [:%, :{}, :^, :&, :_]) ->
          {new_variable_name, new_state} = get_new_variable_name(variable_name, state)
          { {new_variable_name, meta3, context} , new_state }
        _ ->
          {x, current_state}
      end
    end)

    { {:=, meta, [{:{}, meta2, variables}, value]}, state }
  end

  def prepare_variables({:=, meta, [{variable_name, meta2, context}, value]}, state) when not(variable_name in [:%, :{}, :^, :&]) do
    {new_variable_name, new_state} = get_new_variable_name(variable_name, state)
    { {:=, meta, [{new_variable_name, meta2, context}, value]}, new_state }
  end

  def prepare_variables({variable_name, meta, context}, state) do
    if Map.has_key?(state, variable_name) do
      new_variable_name = String.to_atom("#{variable_name}#{Map.get(state, variable_name)}")
    else
      new_variable_name = variable_name
    end

    { {new_variable_name, meta, context}, state }
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

  @doc """
  Translates Elixir AST to JavaScript AST
  """
  def translate(ast) do
    do_translate(ast)
  end

  defp do_translate(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Primative.make_literal(ast)
  end

  defp do_translate(ast) when is_atom(ast) do
    Primative.make_atom(ast)
  end

  defp do_translate(ast) when is_list(ast) do
    Primative.make_array(ast)
  end

  defp do_translate({ one, two }) do
    Primative.make_tuple({one, two})
  end

  defp do_translate({:&, [], [number]}) when is_number(number) do
    Utils.make_array_accessor_call("arguments", number - 1)
  end

  defp do_translate({:&, _, [{:/, _, [{{:., _, [{:__aliases__, _, module_name}, function_name]}, _, []}, _arity]}]}) do
    Utils.make_member_expression(List.last(module_name), function_name)
  end

  defp do_translate({:&, _, [{:/, _, [{function_name, _, _}, _arity]}]}) do
    Primative.make_identifier(function_name)
  end

  defp do_translate({:&, _, body}) do
    Function.make_anonymous_function([], body)
  end

  defp do_translate({:@, _, [{name, _, [value]}]}) do
    Module.make_attribute(name, value)
  end

  defp do_translate({:@, _, [{name, _, _}]}) do
    Primative.make_identifier(name)
  end

  defp do_translate({:%, _, [alias_info, data]}) do
    {_, _, name} = alias_info
    {_, _, data} = data
    Data.make_struct(name, data)
  end

  defp do_translate({:%{}, _, [{:|, _, [map, data]}]}) do
    Data.make_map_update(map, data);
  end

  defp do_translate({:%{}, _, properties}) do
    Data.make_object(properties)
  end

  defp do_translate({:<<>>, _, elements}) do
    is_interpolated_string = Enum.all?(elements, fn(x) -> 
      case x do
        b when is_binary(b) ->
          true
        {:::, _, [_target, {:binary, _, _}]} ->
          true
        _ ->
          false
      end
    end)

    case is_interpolated_string do
      true ->
        Primative.make_interpolated_string(elements)
      _ ->
        Primative.make_bitstring(elements)
    end
  end

  defp do_translate({:unquote, [], [expr]}) do
    ExKernel.make_unquote(expr)
  end

  defp do_translate({:quote, [], [[do: block]]}) do
    translate(block)
  end

  defp do_translate({:quote, [], [opts, [do: block]]}) do
    translate(block)
  end

  defp do_translate({{:., _, [Access, :get]}, _, [target, property]}) do
    Data.make_get_property(target, property)
  end

  defp do_translate({:., _, [module_name, function_name]}) do
    Function.make_function_or_property_call(module_name, function_name)
  end

  defp do_translate({{:., _, [module_name, function_name]}, _, [] }) do
    Function.make_function_or_property_call(module_name, function_name)
  end

  defp do_translate({{:., _, [{:__aliases__, _, module_name}]}, _, params}) do
    Function.make_function_call(hd(module_name), params)
  end

  defp do_translate({{:., _, [module_name, function_name]}, _, params }) do
    Function.make_function_call(module_name, function_name, params)
  end

  defp do_translate({:_, _, _}) do
    Primative.make_identifier(:undefined)
  end

  defp do_translate({:__aliases__, _, aliases}) do
    Primative.make_identifier(aliases)
  end

  defp do_translate({:__block__, _, expressions }) do
    Control.make_block(expressions)
  end

  defp do_translate({:import, _, [{:__aliases__, _, module_name_list}]}) do
    Import.make_import(module_name_list)
  end

  defp do_translate({:import, _, [{:__aliases__, _, module_name_list}, [only: function_list] ]}) do
    Import.make_import(module_name_list, function_list)
  end

  defp do_translate({:alias, _, alias_info}) do
    Import.make_alias_import(alias_info)
  end

  defp do_translate({:require, _, [{:__aliases__, _, module_name_list}]}) do
    Import.make_default_import(module_name_list)
  end

  defp do_translate({:case, _, [condition, [do: clauses]]}) do
    Control.make_case(condition, clauses)
  end

  defp do_translate({:cond, _, [[do: clauses]]}) do
    Control.make_cond(clauses)
  end

  defp do_translate({:for, _, generators}) do
    Control.make_for(generators)
  end

  defp do_translate({:fn, _, [{:->, _, [params, body]}]}) do
    Function.make_anonymous_function(params, body)
  end

  defp do_translate({:.., _, [first, last]}) do
    ExKernel.make_range(first, last)
  end

  defp do_translate({:{}, _, elements}) do
    Primative.make_tuple(elements)
  end

  defp do_translate({:-, _, [number]}) when is_number(number) do
    Expression.make_negative_number(number)
  end

  defp do_translate({:=, _, [left, right]}) do
    PatternMatching.bind(left, right)
  end

  defp do_translate({:<>, _, [left, right]}) do
    Expression.make_binary_expression(:+, left, right)
  end

  defp do_translate({operator, _, [left, right]}) when operator in [:+, :-, :/, :*, :==, :!=] do
    Expression.make_binary_expression(operator, left, right)
  end

  defp do_translate({:def, _, [{:when, _, [{name, _, params} | guards] }, [do: body]] }) do
    Function.make_export_function(name, params, body, guards)
  end

  defp do_translate({:def, _, [{name, _, params}, [do: body]]}) do
    Function.make_export_function(name, params, body)
  end

  defp do_translate({:defp, _, [{:when, _, [{name, _, params} | guards] }, [do: body]] }) do
    Function.make_function(name, params, body, guards)
  end

  defp do_translate({:defp, _, [{name, _, params}, [do: body]]}) do
    Function.make_function(name, params, body)
  end

  defp do_translate({:defstruct, _, attributes}) do
    Data.make_defstruct(attributes)
  end

  defp do_translate({:defexception, _, attributes}) do
    Data.make_defexception(attributes)
  end

  defp do_translate({:raise, _, [alias_info, attributes]}) do
    {_, _, name} = alias_info

    Data.throw_error(name, attributes)
  end

  defp do_translate({:raise, _, [message]}) do
    Data.throw_error(message)
  end

  defp do_translate({:if, _, [test, blocks]}) do
    Control.make_if(test, blocks)
  end

  defp do_translate({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]}) do
    Module.make_module(module_name_list, body)
  end

  defp do_translate({:|>, _, [left, right]}) do
    case right do
      {{:., meta, [module, fun]}, meta2, params} ->
        translate({{:., meta, [module, fun]}, meta2, [left] ++ params})  
      {fun, meta, params} ->
        translate({fun, meta, [left] ++ params})     
    end
  end

  defp do_translate({name, metadata, params}) when is_list(params) do
    name = filter_name(name)

    case metadata[:import] do
      Kernel ->
        Function.make_function_call(:Kernel, name, params)
      _ ->
        Function.make_function_call(name, params)        
    end
  end

  defp do_translate({name, _, _}) do
    Primative.make_identifier(name)
  end

  defp filter_name(name) do
    case name do
      :in ->
        :_in
      _ ->
        name
        |> Atom.to_string
        |> String.replace(~r/(\?|!)/, "")
        |> String.to_atom
    end
  end

end