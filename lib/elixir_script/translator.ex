defmodule ElixirScript.Translator do
  @moduledoc """
  Translates the given Elixir AST into JavaScript AST
  """
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Expression
  alias ElixirScript.Translator.Assignment
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Capture
  alias ElixirScript.Translator.Cond
  alias ElixirScript.Translator.Case
  alias ElixirScript.Translator.For
  alias ElixirScript.Translator.Try
  alias ElixirScript.Translator.Block
  alias ElixirScript.Translator.Struct
  alias ElixirScript.Translator.Module
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Bitstring
  alias ElixirScript.Translator.Receive
  alias ElixirScript.Translator.Quote
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.JS, as: JSLib
  alias ESTree.Tools.Builder, as: JS


  @doc """
  Translates Elixir AST to JavaScript AST
  """
  def translate(ast, env) do
    do_translate(ast, env)
  end

  defp do_translate(ast, _) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Primitive.make_literal(ast)
  end

  defp do_translate(ast, _) when is_atom(ast) do
    Primitive.make_atom(ast)
  end

  defp do_translate(ast, env) when is_list(ast) do
    Primitive.make_list(ast, env)
  end

  defp do_translate({ one, two }, env) do
    Primitive.make_tuple({one, two}, env)
  end

  defp do_translate({operator, _, [value]}, env) when operator in [:-, :!, :+] do
    Expression.make_unary_expression(operator, value, env)
  end

  defp do_translate({:not, _, [value]}, env) do
    Expression.make_unary_expression(:!, value, env)
  end

  defp do_translate({operator, _, [left, right]}, env) when operator in [:+, :-, :/, :*, :==, :!=, :&&, :||, :>, :<, :>=, :<=, :===, :!==] do
    Expression.make_binary_expression(operator, left, right, env)
  end

  defp do_translate({:and, _, [left, right]}, env) do
    Expression.make_binary_expression(:&&, left, right, env)
  end

  defp do_translate({:or, _, [left, right]}, env) do
    Expression.make_binary_expression(:||, left, right, env)
  end

  defp do_translate({:div, _, [left, right]}, env) do
    Expression.make_binary_expression(:/, left, right, env)
  end

  defp do_translate({:rem, _, [left, right]}, env) do
    Expression.make_binary_expression(:%, left, right, env)
  end

  defp do_translate({:throw, _, [params]}, env) do
    JS.throw_statement(Translator.translate(params, env))
  end

  defp do_translate({:<>, context, [left, right]}, env) do
    translate({:+, context, [left, right]}, env)
  end

  defp do_translate({:++, _, [left, right]}, env) do
    quoted = quote do
      Elixir.Core.concat_lists(unquote(left),unquote(right))
    end

    translate(quoted, env)
  end

  defp do_translate({:.., _, [first, last]}, env) do
    quoted_range = quote do: Range.(unquote(first), unquote(last))
    translate(quoted_range, env)
  end

  defp do_translate({:&, [], [number]}, _) when is_number(number) do
    Primitive.make_identifier(String.to_atom("__#{number}"))
  end

  defp do_translate({:&, _, [{:/, _, [{{:., _, [module_name, function_name]}, _, []}, arity]}]}, env) do
    function_name = Utils.filter_name(function_name)
    Capture.make_capture(module_name, function_name, arity, env)
  end

  defp do_translate({:&, _, [{:/, _, [{function_name, _, _}, arity]}]}, env) do
    function_name = Utils.filter_name(function_name)
    Capture.make_capture(function_name, arity, env)
  end

  defp do_translate({:&, _, body}, env) do
    params = Capture.find_value_placeholders(body) |> List.flatten
    Function.make_anonymous_function([{:->, [], [params, body]}], env)
  end

  defp do_translate({:@, _, [{name, _, _}]}, _)
  when name in [:doc, :moduledoc, :type, :typep, :spec, :opaque, :callback, :macrocallback] do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:@, _, [{name, _, [value]}]}, env) do
    name = Utils.filter_name(name)
    Module.make_attribute(name, value, env)
  end

  defp do_translate({:@, _, [{name, _, _}]}, _) do
    name = Utils.filter_name(name)
    Primitive.make_identifier(name)
  end

  defp do_translate({:%, _, [alias_info, data]}, env) do
    Struct.new_struct(alias_info, data, env)
  end

  defp do_translate({:%{}, _, [{:|, _, [map, data]}]}, env) do
    Map.make_map_update(map, data, env);
  end

  defp do_translate({:%{}, _, properties}, env) do
    Map.make_object(properties, env)
  end

  defp do_translate({:<<>>, _, elements}, env) do
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
        Bitstring.make_interpolated_string(elements, env)
      _ ->
        Bitstring.make_bitstring(elements, env)
    end
  end

  defp do_translate({{:., _, [Access, :get]}, _, [target, property]}, env) do
    Map.make_get_property(target, property, env)
  end

  defp do_translate({{:., _, [function_name]}, _, params}, env) do
    Function.make_function_call(function_name, params, env)
  end

  defp do_translate({:., _, [module_name, function_name]} = ast, env) do
    expanded_ast = Macro.expand(ast, env)

    if expanded_ast == ast do
      Function.make_function_or_property_call(module_name, function_name, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({{:., _, [module_name, function_name]}, _, [] } = ast, env) do
    expanded_ast = Macro.expand(ast, env)

    if expanded_ast == ast do
      Function.make_function_or_property_call(module_name, function_name, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({{:., _, [{:__aliases__, _, _} = module_name]}, _, params} = ast, env) do
    expanded_ast = Macro.expand(ast, env)

    if expanded_ast == ast do
      Function.make_function_call(module_name, params, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({{:., _, [{:__aliases__, _, [:JS]}, function_name]}, _, params }, env) do
    JSLib.translate_js_function(function_name, params, env)
  end

  defp do_translate({{:., _, [module_name, function_name]}, _, params } = ast, env) do
    expanded_ast = Macro.expand(ast, env)

    if expanded_ast == ast do
      Function.make_function_call(module_name, function_name, params, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({:_, _, _}, _env) do
    Primitive.make_identifier(:undefined)
  end

  defp do_translate({:__aliases__, _, aliases}, _) do
    Primitive.make_identifier({:__aliases__, [], aliases})
  end

  defp do_translate({:__MODULE__, _, _ }, env) do
    translate(Process.get(:current_module), env)
  end

  defp do_translate({:__block__, _, expressions }, env) do
    Block.make_block(expressions, env)
  end

  defp do_translate({:__DIR__, _, _}, _) do
    JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier(:__DIR__)
      ),
      []
    )
  end

  defp do_translate({:try, _, [ blocks ]}, env) do
    Try.make_try(blocks, env)
  end

  defp do_translate({:receive, _, [expressions] }, env) do
    Receive.make_receive(expressions, env);
  end

  defp do_translate({:super, _, _expressions }, _) do
    raise ElixirScript.UnsupportedError, "super"
  end

  defp do_translate({:__CALLER__, _, _expressions }, _) do
    raise ElixirScript.UnsupportedError, "__CALLER__"
  end

  defp do_translate({:__ENV__, _, _expressions }, _) do
    raise ElixirScript.UnsupportedError, "__ENV__"
  end

  defp do_translate({:quote, _, [[do: expr]]}, env) do
    Quote.make_quote([], expr, env)
  end

  defp do_translate({:quote, _, [opts, [do: expr]]}, env) do
    Quote.make_quote(opts, expr, env)
  end

  defp do_translate({:import, _, _}, _) do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:alias, _, _}, _) do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:require, _, _}, _) do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:case, _, [condition, [do: clauses]]}, env) do
    Case.make_case(condition, clauses, env)
  end

  defp do_translate({:cond, _, [[do: clauses]]}, env) do
    Cond.make_cond(clauses, env)
  end

  defp do_translate({:for, _, generators}, env) do
    For.make_for(generators, env)
  end

  defp do_translate({:fn, _, clauses}, env) do
    Function.make_anonymous_function(clauses, env)
  end

  defp do_translate({:{}, _, elements}, env) do
    Primitive.make_tuple(elements, env)
  end

  defp do_translate({:=, _, [left, right]}, env) do
    Assignment.make_assignment(left, right, env)
  end

  defp do_translate({function, _, [{:when, _, [{name, _, _params} | _guards] }, [do: _body]] } = ast, env) when function in [:def, :defp] do
    Function.process_function(Utils.filter_name(name), [ast], env)
  end

  defp do_translate({function, _, [{name, _, _params}, [do: _body]]} = ast, env) when function in [:def, :defp] do
    Function.process_function(Utils.filter_name(name), [ast], env)
  end

  defp do_translate({:defstruct, _, attributes}, env) do
    Struct.make_defstruct(attributes, env)
  end

  defp do_translate({:defexception, _, attributes}, env) do
    Struct.make_defexception(attributes, env)
  end

  defp do_translate({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]}, env) do
    Module.make_module(module_name_list, body, env)
  end

  defp do_translate({:defprotocol, _, _}, _) do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:defmacro, _, _}, _) do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:defmacrop, _, _}, _) do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:defimpl, _, _}, _) do
    %ElixirScript.Translator.Group{}
  end

  defp do_translate({:|, _, [item, list]}, env) do
    quoted = quote do
      Elixir.Core.prepend_to_list(unquote(list), unquote(item))
    end

    translate(quoted, env)
  end

  defp do_translate({:raise, _, [alias_info, attributes]}, env) do
    JS.throw_statement(
      Struct.new_struct(alias_info, {:%{}, [], attributes }, env)
    )
  end

  defp do_translate({:raise, _, [message]}, env) do
    JS.throw_statement(
      JS.object_expression(
        [
          Map.make_property(translate(:__struct__, env), translate(:RuntimeError, env)),
          Map.make_property(translate(:__exception__, env), translate(true, env)),
          Map.make_property(translate(:message, env), JS.literal(message))
        ]
      )
    )
  end

  defp do_translate({name, context, params} = ast, env) when is_list(params) do
      expanded_ast = Macro.expand(ast, env)

      if expanded_ast == ast do
        imported_module = ElixirScript.State.get_module(context[:import])

        unless imported_module do
          module = ElixirScript.State.get_module(Process.get(:current_module))
          imported_module_name = ElixirScript.Module.imported?(module, name)
          if imported_module_name do
            imported_module = ElixirScript.State.get_module(imported_module_name)
          end
        end

        if imported_module do
          ElixirScript.State.add_module_reference(Process.get(:current_module), imported_module.name)
          Function.make_function_call(ElixirScript.Module.name_to_quoted(imported_module.name), name, params, env)
        else
          Function.make_function_call(name, params, env)
        end
      else
        translate(expanded_ast, env)
      end
  end

  defp do_translate({ name, _, params }, _) when is_atom(params) do
    #TODO: check if function
    name = Utils.filter_name(name)
    Primitive.make_identifier(name)
  end

end
