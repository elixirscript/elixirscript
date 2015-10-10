defmodule ElixirScript.Translator.Kernel do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Expression

  @kernel_definitions Kernel.__info__(:functions) ++ Kernel.__info__(:macros)

  def is_defined_in_kernel(name, arity) do
    { name, arity } in @kernel_definitions
  end

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

  defp do_translate({:++, _, [left, right]}, env) do
    JS.call_expression(
      JS.member_expression(
        Translator.translate(left, env),
        JS.identifier(:concat)
      ),
      [Translator.translate(right, env)]
    )
  end

  defp do_translate({:.., _, [first, last]}, env) do
    quoted_range = quote do: Range.(unquote(first), unquote(last))

    Translator.translate(quoted_range, env)
  end

  defp do_translate({:abs, _, [number]}, env) do
    quoted = quote do
      Math.abs(unquote(number))
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:apply, _, [fun, args]}, env) do
    quoted = quote do
      unquote(fun)(unquote_splicing(args))
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:apply, _, [module, fun, args]}, env) do
    quoted = quote do
      unquote(module).unquote(fun)(unquote_splicing(args))
    end

    Translator.translate(quoted, env)
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
    quoted = quote do
      Math.round(unquote(value))
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:self, _, []}, _) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:self),
        JS.member_expression(
          JS.identifier(:scheduler),
          JS.identifier(:pid)
        )
      ),
      []
    )
  end

  defp do_translate({:spawn, _, [fun]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:self),
        JS.member_expression(
          JS.identifier(:scheduler),
          JS.identifier(:spawn)
        )
      ),
      [Translator.translate(fun, env)]
    )
  end

  defp do_translate({:spawn, _, [module, fun, args]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:self),
        JS.member_expression(
          JS.identifier(:scheduler),
          JS.identifier(:spawn_from_module)
        )
      ),
      [Translator.translate(module, env), Translator.translate(fun, env), Translator.translate(args, env)]
    )
  end

  defp do_translate({:spawn_link, _, [fun]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:self),
        JS.member_expression(
          JS.identifier(:scheduler),
          JS.identifier(:spawn_link)
        )
      ),
      [Translator.translate(fun, env)]
    )
  end

  defp do_translate({:spawn_link, _, [module, fun, args]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:self),
        JS.member_expression(
          JS.identifier(:scheduler),
          JS.identifier(:spawn_link_from_module)
        )
      ),
      [Translator.translate(module, env), Translator.translate(fun, env), Translator.translate(args, env)]
    )
  end

  defp do_translate({:exit, _, [reason]}, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:self),
        JS.member_expression(
          JS.identifier(:scheduler),
          JS.identifier(:exit)
        )
      ),
      [Translator.translate(reason, env)]
    )
  end

  defp do_translate({:tuple_size, _, [tuple]}, env) do
    quoted = quote do
      unquote(tuple).count()
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:map_size, _, [map]}, env) do
    quoted = quote do
      Object.keys(unquote(map)).length
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:max, _, [first, second]}, env) do
    quoted = quote do
      Math.max(unquote(first), unquote(second))
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:min, _, [first, second]}, env) do
    quoted = quote do
      Math.min(unquote(first), unquote(second))
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:if, _, _} = ast, env) do
    Macro.expand(ast, env)
    |> Translator.translate(env)
  end

  defp do_translate({:unless, _, _} = ast, env) do
    Macro.expand(ast, env)
    |> Translator.translate(env)
  end

  defp do_translate({:|>, _, [left, right]}, env) do
    case right do
      {{:., meta, [module, fun]}, meta2, params} ->
        Translator.translate({{:., meta, [module, fun]}, meta2, [left] ++ params}, env)  
      {fun, meta, params} ->
        Translator.translate({fun, meta, [left] ++ params}, env)     
    end
  end

  defp do_translate({:hd, _, [list]}, env) do
    quoted = quote do
      unquote(list)[0]
    end

    Translator.translate(quoted, env)
  end

  defp do_translate({:tl, _, [list]}, env) do
    JS.call_expression(
      JS.member_expression(
        Translator.translate(list, env),
        JS.identifier(:slice)
      ),
      [JS.literal(1)]
    )
  end

  defp do_translate({:length, _, [list]}, env) when is_list(list) do
    JS.member_expression(
      Translator.translate(list, env),
      JS.identifier(:length)
    )
  end

  defp do_translate({:raise, _, [alias_info, attributes]}, env) do
    {_, _, name} = alias_info

    JS.throw_statement(
      JS.call_expression(
        JS.member_expression(
          JS.identifier(List.last(name)),
          JS.identifier(:defexception)
        ),
        Enum.map(attributes, fn({k, v})->
          JS.assignment_expression(
            :=,
            JS.identifier(k),
            Translator.translate(v, env)
          )
        end)
      )
    )
  end

  defp do_translate({:raise, _, [message]}, env) do
    JS.throw_statement(
      JS.object_expression(
        [
          Map.make_property(Translator.translate(:__struct__, env), Translator.translate(:RuntimeError, env)),
          Map.make_property(Translator.translate(:message, env), JS.literal(message))
        ]
      )
    )
  end

  defp do_translate({:to_string, _, [param]}, env) when is_binary(param) do
    Translator.translate(param, env)
  end

  defp do_translate({name, _, params}, env) do
    Function.make_function_call(:Kernel, name, params, env) 
  end

end