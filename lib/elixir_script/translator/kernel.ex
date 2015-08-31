defmodule ElixirScript.Translator.Kernel do
  @moduledoc false
  require Logger
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

  defp do_translate({operator, _, [value]}, env) when operator in [:-, :!] do
    Expression.make_unary_expression(operator, value, env)
  end

  defp do_translate({:<>, _, [left, right]}, env) do
    Expression.make_binary_expression(:+, left, right, env)
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

  defp do_translate({operator, _, [left, right]}, env) when operator in [:+, :-, :/, :*, :==, :!=, :&&, :||, :>, :<, :>=, :<=, :===] do
    Expression.make_binary_expression(operator, left, right, env)
  end

  defp do_translate({:and, _, [left, right]}, env) do
    Expression.make_binary_expression(:&&, left, right, env)
  end

  defp do_translate({:or, _, [left, right]}, env) do
    Expression.make_binary_expression(:||, left, right, env)
  end

  defp do_translate({:if, _, [test, blocks]}, env) do
    If.make_if(test, blocks)
  end

  defp do_translate({:|>, _, [left, right]}, env) do
    case right do
      {{:., meta, [module, fun]}, meta2, params} ->
        Translator.translate({{:., meta, [module, fun]}, meta2, [left] ++ params})  
      {fun, meta, params} ->
        Translator.translate({fun, meta, [left] ++ params})     
    end
  end

  defp do_translate({:raise, _, [alias_info, attributes]}, env) do
    {_, _, name} = alias_info

    Raise.throw_error(name, attributes)
  end

  defp do_translate({:raise, _, [message]}, env) do
    Raise.throw_error(message)
  end

  defp do_translate({:to_string, _, [param]}, env) when is_binary(param) do
    Translator.translate(param)
  end

  defp do_translate({name, _, params}, env) do
      Function.make_function_call(:Kernel, name, params, env) 
  end

  def make_range(first, last) do
    Translator.translate(quote do: Range.(unquote(first), unquote(last)))
  end

  def concat_lists(list1, list2) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier(:List),
        Builder.identifier(:concat)
      ),
      [
        Translator.translate(list1),
        Translator.translate(list2)
      ]
    )
  end

end