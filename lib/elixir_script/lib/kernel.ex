defmodule ElixirScript.Lib.Kernel do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Utils
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Expression
  alias ElixirScript.Translator.If
  alias ElixirScript.Translator.Raise
  alias ElixirScript.Translator.Module
  alias ElixirScript.Translator.Struct
  alias ElixirScript.Translator.Utils

  def translate_kernel_function(name, params, env) do
    do_translate({name, [], params}, env)
  end

  defp do_translate({operator, _, [value]}, env) when operator in [:-, :!, :+] do
    Expression.make_unary_expression(operator, value, env)
  end

  defp do_translate({operator, _, [left, right]}, env) when operator in [:+, :-, :/, :*, :==, :!=, :&&, :||, :>, :<, :>=, :<=, :===, :!==] do
    Expression.make_binary_expression(operator, left, right, env)
  end

  defp do_translate({:<>, _, [left, right]}, env) do
    Expression.make_binary_expression(:+, left, right, env)
  end

  defp do_translate({:--, _, [left, right]}, env) do

  end

  defp do_translate({:++, _, [left, right]}, env) do
    JS.call_expression(
      JS.member_expression(
        Translator.translate(left, env),
        JS.identifier(:concat)
      ),
      [
        Translator.translate(right, env),
      ]
    )
  end

  defp do_translate({:.., _, [first, last]}, _) do
    Translator.translate(quote do: Range.(unquote(first), unquote(last)))
  end

  defp do_translate({:=~, _, [left, right]}, _) do
    
  end

  defp do_translate({:abs, _, [number]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:Map),
        JS.identifier(:abs)
      ),
      [Translator.translate(number, env)]
    ) 
  end

  defp do_translate({:apply, _, [fun, args]}, env) do
    JS.call_expression(
      JS.member_expression(
        Translator.translate(fun, env),
        JS.identifier(:apply)
      ),
      [JS.identifier(:this)] ++ Enum.map(args, &Translator.translate(&1, env))
    )
  end

  defp do_translate({:apply, _, [module, fun, args]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          Translator.translate(module, env),
          Translator.translate(fun, env)
        ),
        JS.identifier(:apply)
      ),
      [JS.identifier(:this)] ++ Enum.map(args, &Translator.translate(&1, env))
    )
  end

  defp do_translate({:and, _, [left, right]}, env) do
    Expression.make_binary_expression(:&&, left, right, env)
  end

  defp do_translate({:div, _, [left, right]}, env) do
    Expression.make_binary_expression(:/, left, right, env)
  end

  defp do_translate({:or, _, [left, right]}, env) do
    Expression.make_binary_expression(:||, left, right, env)
  end

  defp do_translate({:not, _, [value]}, env) do
    Expression.make_unary_expression(:!, value, env)
  end

  defp do_translate({:rem, _, [left, right]}, env) do
    Expression.make_binary_expression(:%, left, right, env)
  end

  defp do_translate({:round, _, [value]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:Math),
        JS.identifier(:round)
      ),
      [Translator.translate(value, env)]
    )
  end

  defp do_translate({:self, _, []}, _) do
    JS.identifier(:self)
  end

  defp do_translate({:tuple_size, _, [tuple]}, env) do
    JS.member_expression(
      JS.member_expression(
        Translator.translate(tuple, env),
        JS.identifier(:__tuple__)
      ),
      JS.identifier(:length)
    )
  end

  defp do_translate({:map_size, _, [map]}, env) do
    JS.member_expression(
      JS.call_expression(
        JS.member_expression(
          JS.identifier(:Object),
          JS.identifier(:keys)
        ),
        [Translator.translate(map, env)]
      ),
      JS.identifier(:length)
    )
  end

  defp do_translate({:max, _, params}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:Math),
        JS.identifier(:max)
      ),
      Enum.map(params, &Translator.translate(&1, env))
    )
  end

  defp do_translate({:min, _, params}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:Math),
        JS.identifier(:min)
      ),
      Enum.map(params, &Translator.translate(&1, env))
    )
  end

  defp do_translate({:if, _, [test, blocks]}, _) do
    If.make_if(test, blocks)
  end

  defp do_translate({:|>, _, [left, right]}, _) do
    case right do
      {{:., meta, [module, fun]}, meta2, params} ->
        Translator.translate({{:., meta, [module, fun]}, meta2, [left] ++ params})  
      {fun, meta, params} ->
        Translator.translate({fun, meta, [left] ++ params})     
    end
  end

  defp do_translate({:hd, _, [list]}, env) do
    JS.member_expression(
      Translator.translate(list, env),
      JS.identifier(0),
      true
    )
  end

  defp do_translate({:tl, _, [list]}, env) do
    JS.call_expression(
      JS.member_expression(
        Translator.translate(list, env),
        JS.identifier(:splice)
      ),
      [1]
    )
  end

  defp do_translate({:length, _, [list]}, env) when is_list(list) do
    JS.member_expression(
      Translator.translate(list, env),
      JS.identifier(:length)
    )
  end

  defp do_translate({:raise, _, [alias_info, attributes]}, _) do
    {_, _, name} = alias_info

    Raise.throw_error(name, attributes)
  end

  defp do_translate({:raise, _, [message]}, _) do
    Raise.throw_error(message)
  end

  defp do_translate({:to_string, _, [param]}, _) when is_binary(param) do
    Translator.translate(param)
  end

  defp do_translate({name, _, params}, env) do
    Function.make_function_call(:Kernel, name, params, env) 
  end

end