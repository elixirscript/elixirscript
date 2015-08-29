defmodule ElixirScript.Translator do
  @moduledoc """
  Translates the given Elixir AST into JavaScript AST
  """
  alias ElixirScript.Preprocess.Variables
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Assignment
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Struct
  alias ElixirScript.Translator.Raise
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Capture
  alias ElixirScript.Translator.Expression
  alias ElixirScript.Translator.Import
  alias ElixirScript.Translator.If
  alias ElixirScript.Translator.Cond
  alias ElixirScript.Translator.Case
  alias ElixirScript.Translator.For
  alias ElixirScript.Translator.Try
  alias ElixirScript.Translator.Block
  alias ElixirScript.Translator.Module
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Bitstring
  alias ElixirScript.Translator.Receive
  alias ElixirScript.Translator.Kernel, as: ExKernel

  @doc """
  Translates Elixir AST to JavaScript AST
  """
  def translate(ast) do
    do_translate(ast)
  end

  defp do_translate(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Primitive.make_literal(ast)
  end

  defp do_translate(ast) when is_atom(ast) do
    Primitive.make_atom(ast)
  end

  defp do_translate(ast) when is_list(ast) do
    Primitive.make_list(ast)
  end

  defp do_translate({ one, two }) do
    Primitive.make_tuple({one, two})
  end

  defp do_translate({:&, [], [number]}) when is_number(number) do
    Primitive.make_identifier(String.to_atom("__#{number}"))
  end

  defp do_translate({:&, _, [{:/, _, [{{:., _, [{:__aliases__, _, module_name}, function_name]}, _, []}, arity]}]}) do
    function_name = Utils.filter_name(function_name)
    Capture.make_capture(List.last(module_name), function_name, arity)
  end

  defp do_translate({:&, _, [{:/, _, [{function_name, _, _}, arity]}]}) do
    function_name = Utils.filter_name(function_name)
    Capture.make_capture(function_name, arity)
  end

  defp do_translate({:&, _, body}) do
    params = Capture.find_value_placeholders(body) |> List.flatten
    Function.make_anonymous_function([{:->, [], [params, body]}])
  end

  defp do_translate({:@, _, [{name, _, [value]}]}) do
    name = Utils.filter_name(name)
    Module.make_attribute(name, value)
  end

  defp do_translate({:@, _, [{name, _, _}]}) do
    name = Utils.filter_name(name)
    Primitive.make_identifier(name)
  end

  defp do_translate({:%, _, [alias_info, data]}) do
    {_, _, name} = alias_info
    {_, _, data} = data
    Struct.make_struct(name, data)
  end

  defp do_translate({:%{}, _, [{:|, _, [map, data]}]}) do
    Map.make_map_update(map, data);
  end

  defp do_translate({:%{}, _, properties}) do
    Map.make_object(properties)
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
        Bitstring.make_interpolated_string(elements)
      _ ->
        Bitstring.make_bitstring(elements)
    end
  end

  defp do_translate({{:., _, [Access, :get]}, _, [target, property]}) do
    Map.make_get_property(target, property)
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
    Primitive.make_identifier(:undefined)
  end

  defp do_translate({:__aliases__, _, aliases}) do
    Primitive.make_identifier(aliases)
  end

  defp do_translate({:__block__, _, expressions }) do
    Block.make_block(expressions)
  end

  defp do_translate({:__DIR__, _, _expressions }) do
    ExKernel.make___DIR__()
  end

  defp do_translate({:try, _, [ blocks ]}) do
    Try.make_try(blocks)
  end

  defp do_translate({:receive, _, [expressions] }) do
    Receive.make_receive(expressions);
  end

  defp do_translate({:super, _, _expressions }) do
    raise ElixirScript.UnsupportedError, :super
  end

  defp do_translate({:__CALLER__, _, _expressions }) do
    raise ElixirScript.UnsupportedError, :__CALLER__
  end

  defp do_translate({:__ENV__, _, _expressions }) do
    raise ElixirScript.UnsupportedError, :__ENV__
  end

  defp do_translate({:quote, [], _expr}) do
    raise ElixirScript.UnsupportedError, :quote
  end

  defp do_translate({:unquote, [], _expr}) do
    raise ElixirScript.UnsupportedError, :unquote
  end

  defp do_translate({:unquote_splicing, _, _expressions }) do
    raise ElixirScript.UnsupportedError, :unquote_splicing
  end

  defp do_translate({:import, _, [{:__aliases__, _, module_name_list}]}) do
    Import.make_import(module_name_list, [])
  end

  defp do_translate({:import, _, [{:__aliases__, _, module_name_list}, options ]}) do
    Import.make_import(module_name_list, options)
  end

  defp do_translate({:alias, _, [alias_info, options]}) do
    Import.make_alias_import(alias_info, options)
  end

  defp do_translate({:alias, _, [alias_info]}) do
    Import.make_alias_import(alias_info, [])
  end

  defp do_translate({:require, _, [alias_info, options]}) do
    Import.make_alias_import(alias_info, options)
  end

  defp do_translate({:require, _, [alias_info]}) do
    Import.make_alias_import(alias_info, [])
  end

  defp do_translate({:case, _, [condition, [do: clauses]]}) do
    Case.make_case(condition, clauses)
  end

  defp do_translate({:cond, _, [[do: clauses]]}) do
    Cond.make_cond(clauses)
  end

  defp do_translate({:for, _, generators}) do
    For.make_for(generators)
  end

  defp do_translate({:fn, _, clauses}) do
    Function.make_anonymous_function(clauses)
  end

  defp do_translate({:.., _, [first, last]}) do
    ExKernel.make_range(first, last)
  end

  defp do_translate({:{}, _, elements}) do
    Primitive.make_tuple(elements)
  end

  defp do_translate({operator, _, [value]}) when operator in [:-, :!] do
    Expression.make_unary_expression(operator, value)
  end

  defp do_translate({:=, _, [left, right]}) do
    Assignment.make_assignment(left, right)
  end

  defp do_translate({:<>, _, [left, right]}) do
    Expression.make_binary_expression(:+, left, right)
  end

  defp do_translate({:++, _, [left, right]}) do
    ExKernel.concat_lists(left, right)
  end

  defp do_translate({operator, _, [left, right]}) when operator in [:+, :-, :/, :*, :==, :!=, :&&, :||, :>, :<, :>=, :<=, :===] do
    Expression.make_binary_expression(operator, left, right)
  end

  defp do_translate({:and, _, [left, right]}) do
    Expression.make_binary_expression(:&&, left, right)
  end

  defp do_translate({:or, _, [left, right]}) do
    Expression.make_binary_expression(:||, left, right)
  end

  defp do_translate({function, _, [{:when, _, [{name, _, _params} | _guards] }, [do: _body]] } = ast) when function in [:def, :defp] do
    Function.process_function(Utils.filter_name(name), [ast])
  end

  defp do_translate({function, _, [{name, _, _params}, [do: _body]]} = ast) when function in [:def, :defp] do
    Function.process_function(Utils.filter_name(name), [ast])
  end

  defp do_translate({:defstruct, _, attributes}) do
    Struct.make_defstruct(attributes)
  end

  defp do_translate({:defexception, _, attributes}) do
    Struct.make_defexception(attributes)
  end

  defp do_translate({:raise, _, [alias_info, attributes]}) do
    {_, _, name} = alias_info

    Raise.throw_error(name, attributes)
  end

  defp do_translate({:raise, _, [message]}) do
    Raise.throw_error(message)
  end

  defp do_translate({:if, _, [test, blocks]}) do
    If.make_if(test, blocks)
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
    name = Utils.filter_name(name)

    case metadata[:import] do
      Kernel ->
        Function.make_function_call(:Kernel, name, params)
      _ ->
        Function.make_function_call(name, params)        
    end
  end

  defp do_translate({ name, _, _ }) do
    name = Utils.filter_name(name)   
    Primitive.make_identifier(name)
  end

end
