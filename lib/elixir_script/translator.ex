defmodule ElixirScript.Translator do
  require Logger
  alias ElixirScript.Preparer
  alias ElixirScript.Translator.Primitive
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
    Utils.make_array_accessor_call("arguments", number - 1)
  end

  defp do_translate({:&, _, [{:/, _, [{{:., _, [{:__aliases__, _, module_name}, function_name]}, _, []}, _arity]}]}) do
    function_name = Utils.filter_name(function_name)
    Utils.make_member_expression(List.last(module_name), function_name)
  end

  defp do_translate({:&, _, [{:/, _, [{function_name, _, _}, _arity]}]}) do
    function_name = Utils.filter_name(function_name)
    Primitive.make_identifier(function_name)
  end

  defp do_translate({:&, _, body}) do
    Function.make_anonymous_function([], body)
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
        Primitive.make_interpolated_string(elements)
      _ ->
        Primitive.make_bitstring(elements)
    end
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
    Primitive.make_identifier(:undefined)
  end

  defp do_translate({:__aliases__, _, aliases}) do
    Primitive.make_identifier(aliases)
  end

  defp do_translate({:__block__, _, expressions }) do
    Control.make_block(expressions)
  end

  defp do_translate({:__DIR__, _, _expressions }) do
    ExKernel.make___DIR__()
  end


#  defp do_translate({:try, _, [ [do: do_block, rescue: clauses, after: after_block] ]}) do
#    Control.make_try(do_block, clauses, after_block)
#  end
#
#  defp do_translate({:try, _, [ [do: do_block, rescue: clauses] ]}) do
#    Control.make_try(do_block, clauses)
#  end

  defp do_translate({:try, _, _expressions}) do
    raise ElixirScript.UnsupportedError, ":try"
  end

  defp do_translate({:receive, _, _expressions }) do
    raise ElixirScript.UnsupportedError, :receive
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
    Primitive.make_tuple(elements)
  end

  defp do_translate({operator, _, [value]}) when operator in [:-, :!] do
    Expression.make_unary_expression(operator, value)
  end

  defp do_translate({:=, _, [left, right]}) do
    PatternMatching.bind(left, right)
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

  defp do_translate({:def, _, [{:when, _, [{_name, _, _params} | _guards] }, [do: _body]] } = ast) do
    {:def, _, [{:when, _, [{name, _, params} | guards] }, [do: body]] } = Preparer.prepare(ast)

    name = Utils.filter_name(name)
    Function.make_export_function(name, params, body, guards)
  end

  defp do_translate({:def, _, [{_name, _, _params}, [do: _body]]} = ast) do
    {:def, _, [{name, _, params}, [do: body]]} = Preparer.prepare(ast)

    name = Utils.filter_name(name)
    Function.make_export_function(name, params, body)
  end

  defp do_translate({:defp, _, [{:when, _, [{_name, _, _params} | _guards] }, [do: _body]] } = ast) do
    {:defp, _, [{:when, _, [{name, _, params} | guards] }, [do: body]] } = Preparer.prepare(ast)

    name = Utils.filter_name(name)
    Function.make_function(name, params, body, guards)
  end

  defp do_translate({:defp, _, [{_name, _, _params}, [do: _body]]} = ast) do
    {:defp, _, [{name, _, params}, [do: body]]} = Preparer.prepare(ast)

    name = Utils.filter_name(name)
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
