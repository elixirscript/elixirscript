defmodule ElixirScript.Translator do
  @moduledoc false
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.Translator.Expression
  alias ElixirScript.Translator.Match
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Call
  alias ElixirScript.Translator.Def
  alias ElixirScript.Translator.Capture
  alias ElixirScript.Translator.Cond
  alias ElixirScript.Translator.Case
  alias ElixirScript.Translator.For
  alias ElixirScript.Translator.Try
  alias ElixirScript.Translator.With
  alias ElixirScript.Translator.Block
  alias ElixirScript.Translator.Struct
  alias ElixirScript.Translator.Defmodule
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Bitstring
  alias ElixirScript.Translator.Quote
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.JS, as: JSLib
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Rewriter

  # A list of erlang modules. These are rewritten into equivalent
  # JavaScript functions using ElixirScript.Translator.Rewriter
  @erlang_modules [
    :erlang,
    :maps,
    :lists,
    :gen,
    :elixir_errors,
    :supervisor,
    :application,
    :code,
    :elixir_utils,
    :file
  ]

  @module_attributes_to_ignore [
    :doc, :moduledoc, :type, :typep, :spec,
    :opaque, :callback, :macrocallback, :after_compile,
    :before_compile, :behaviour, :compile, :file,
    :on_definition, :on_load, :dialyzer, :vsn, :external_resource
  ]

  @function_types [:def, :defp, :defgen, :defgenp]
  @generator_types [:defgen, :defgenp]


  @doc """
  Translates the given Elixir AST to JavaScript AST. The given `env` is a `ElixirScript.Macro.Env`
  used to track the variables, imports, aliases, and scopes like `Macro.Env`. The JavaScript AST and
  the an updated `ElixirScript.Macro.Env` is returned
  """
  @spec translate(term, ElixirScript.Macro.Env.t) :: { ESTree.Node.t,  ElixirScript.Macro.Env.t }
  def translate(ast, env) do
    do_translate(ast, env)
  end


  @doc """
  Same as `translate/2`, but returns only the JavaScript AST
  """
  @spec translate!(term, ElixirScript.Macro.Env.t) :: ESTree.Node.t
  def translate!(ast, env) do
    { js_ast, _ } = translate(ast, env)
    js_ast
  end

  defp do_translate(ast, env) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    { Primitive.make_literal(ast), env }
  end

  defp do_translate(ast, env) when is_atom(ast) do
    { Primitive.make_atom(ast), env }
  end

  defp do_translate([ {:|, _, [left, right] } ], env) do
    quoted = quote do
      [unquote(left)].concat(unquote(right))
    end

    translate(quoted, env)
  end

  defp do_translate(ast, env) when is_list(ast) do
    Primitive.make_list(ast, env)
  end

  defp do_translate({ one, two }, env) do
    quoted = quote do
      JS.new(Bootstrap.Core.Tuple, [unquote(one), unquote(two)])
    end

    translate(quoted, env)
  end

  defp do_translate({operator, _, [value]}, env) when operator in [:-, :!, :+] do
    Expression.make_unary_expression(operator, value, env)
  end

  defp do_translate({:not, _, [value]}, env) do
    Expression.make_unary_expression(:!, value, env)
  end

  defp do_translate({:"~~~", _, [value]}, env) do
    Expression.make_unary_expression(:"~~~", value, env)
  end

  defp do_translate({operator, _, [left, right]}, env) when operator in [:+, :-, :/, :*, :==, :!=, :&&, :||, :>, :<, :>=, :<=, :===, :!==, :"**"] do
    Expression.make_binary_expression(operator, left, right, env)
  end

  defp do_translate({:&&&, _, [left, right]}, env) do
    Expression.make_binary_expression(:&, left, right, env)
  end

  defp do_translate({:<<<, _, [left, right]}, env) do
    Expression.make_binary_expression(:<, left, right, env)
  end

  defp do_translate({:>>>, _, [left, right]}, env) do
    Expression.make_binary_expression(:^, left, right, env)
  end

  defp do_translate({:^^^, _, [left, right]}, env) do
    Expression.make_binary_expression(:^, left, right, env)
  end

  defp do_translate({:|||, _, [left, right]}, env) do
    Expression.make_binary_expression(:|, left, right, env)
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
    { result, env } = translate(params, env)
    { JS.throw_statement(result), env }
  end

  defp do_translate({:<>, context, [left, right]}, env) do
    translate({:+, context, [left, right]}, env)
  end

  defp do_translate({:++, _, [left, right]}, env) do
    translate({{:., [], [left, :concat]}, [], [right]}, env)
  end

  defp do_translate({:&, _, [number]}, env) when is_number(number) do
    { Identifier.make_identifier(String.to_atom("__#{number}")), env }
  end

  defp do_translate({:&, _, [{:/, _, [{{:., _, [module_name, function_name]}, _, []}, arity]}]}, env) do
    { Capture.make_capture(module_name, function_name, arity, env), env }
  end

  defp do_translate({:&, _, [{:/, _, [{function_name, _, _}, arity]}]}, env) do
    { Capture.make_capture(function_name, arity, env), env }
  end

  defp do_translate({:&, _, [body]}, env) do
    params = Capture.find_value_placeholders(body) |> List.flatten
    Function.make_anonymous_function([{:->, [], [params, body]}], env)
  end

  defp do_translate({:@, _, [{name, _, _}]}, env)
  when name in @module_attributes_to_ignore do
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:@, _, [{name, _, [value]}]}, env) do
    { Defmodule.make_attribute(name, value, env), env }
  end

  defp do_translate({:@, _, [{name, _, _}]}, env) do
    { Identifier.make_identifier(name), env }
  end

  defp do_translate({:%, _, [alias_info, data]}, env) do
    { Struct.new_struct(alias_info, data, env), env }
  end

  defp do_translate({:%{}, _, [{:|, _, [map, data]}]}, env) do
    Map.make_map_update(map, data, env)
  end

  defp do_translate({:%{}, _, properties}, env) do
    { Map.make_object(properties, env), env }
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

  defp do_translate({{:., _, [erlang_module, _]}, _, _} = erlang_function_call, env) when erlang_module in @erlang_modules do
    Rewriter.rewrite(erlang_function_call)
    |> translate(env)
  end

  defp do_translate({{:., _, [Access, :get]}, _, [target, property]}, env) do
    { Map.make_get_property(target, property, env), env }
  end

  defp do_translate({{:., _, [function_name]}, _, params}, env) do
    Call.make_function_call(function_name, params, env)
  end

  defp do_translate({:., _, [module_name, function_name]} = ast, env) do
    expanded_ast = Macro.expand(ast, env.env)

    if expanded_ast == ast do
      module_name = create_module_name(module_name, env)
      Call.make_function_or_property_call(module_name, function_name, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({{:., _, [module_name, function_name]}, _, [] } = ast, env) do
    expanded_ast = Macro.expand(ast, env.env)

    if expanded_ast == ast do
      module_name = create_module_name(module_name, env)
      Call.make_function_or_property_call(module_name, function_name, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({{:., _, [{:__aliases__, _, _} = module_name]}, _, params} = ast, env) do
    expanded_ast = Macro.expand(ast, env.env)

    if expanded_ast == ast do
      module_name = create_module_name(module_name, env)
      Call.make_function_call(module_name, params, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({{:., context1, [{:__aliases__, context2, [:Elixir, :Enum]}, function_name]}, context3, params }, env) do
    translate({{:., context1, [{:__aliases__, context2, [:Enum]}, function_name]}, context3, params }, env)
  end

  defp do_translate({{:., context1, [{:__aliases__, context2, [:Enum]}, function_name]}, context3, params }, env) do
    translate({{:., context1, [{:__aliases__, context2, [:Bootstrap, :Enum]}, function_name]}, context3, params }, env)
  end

  defp do_translate({{:., _, [{:__aliases__, _, [:JS]}, function_name]}, _, params }, env) when function_name in @generator_types do
    do_translate({function_name, [], params}, env)
  end

  defp do_translate({{:., _, [{:__aliases__, _, [:JS]}, function_name]}, _, params }, env) do
    JSLib.translate_js_function(function_name, params, env)
  end

  defp do_translate({{:., _, [module_name, function_name]}, _, params } = ast, env) do
    expanded_ast = Macro.expand(ast, env.env)

    if expanded_ast == ast do
      module_name = create_module_name(module_name, env)
      Call.make_function_call(module_name, function_name, params, env)
    else
      translate(expanded_ast, env)
    end
  end

  defp do_translate({:_, _, _}, env) do
    { Identifier.make_identifier(:undefined), env }
  end

  defp do_translate({:__aliases__, _, aliases} = ast, env) do
    module_name = create_module_name(ast, env)
    Call.make_module_name(module_name, env)
  end

  defp do_translate({:__MODULE__, _, _ }, env) do
    translate(env.module, env)
  end

  defp do_translate({:__block__, _, expressions }, env) do
    Block.make_block(expressions, env)
  end

  defp do_translate({:__DIR__, _, _}, env) do
    case env.file do
      nil ->
        { JS.identifier(:null), env }
      filepath ->
        { JS.literal(Path.dirname(filepath)), env }
    end
  end

  defp do_translate({:try, _, [ blocks ]}, env) do
    Try.make_try(blocks, env)
  end

  defp do_translate({:with, _, args }, env ) do
    With.make_with(args, env)
  end

  defp do_translate({:super, _, _expressions }, _ ) do
    raise ElixirScript.Translator.UnsupportedError, "super"
  end

  defp do_translate({:__CALLER__, _, _expressions }, env) do
    env_to_translate = ElixirScript.Translator.LexicalScope.caller(env)

    quoted = Macro.escape(env_to_translate)
    translate(quoted, env)
  end

  defp do_translate({:__ENV__, _, _expressions }, env) do
    env_to_translate = ElixirScript.Translator.LexicalScope.env(env)

    quoted = Macro.escape(env_to_translate)
    translate(quoted, env)
  end

  defp do_translate({:quote, _, [[do: expr]]}, env) do
    { Quote.make_quote([], expr, env), env }
  end

  defp do_translate({:quote, _, [opts, [do: expr]]}, env) do
    { Quote.make_quote(opts, expr, env), env }
  end

  defp do_translate({:import, _, [{{:., _, [{:__aliases__, _, head_import_name}, :{}]}, _, tail_imports }]}, env) do
    env = Enum.reduce(tail_imports, env, fn({:__aliases__, context, name}, acc) ->
      full_module_name = { :__aliases__, context, head_import_name ++ name }

      module_name = Utils.quoted_to_name(full_module_name)
      ElixirScript.Translator.LexicalScope.add_import(acc, module_name)
    end)

    { %ElixirScript.Translator.Empty{}, env }
  end


  defp do_translate({:import, _, [{:__aliases__, _, _} = module_name]}, env) do
    module_name = Utils.quoted_to_name(module_name)

    env = ElixirScript.Translator.LexicalScope.add_import(env, module_name)
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:import, _, [{:__aliases__, _, _} = module_name, options]}, env) do
    module_name = Utils.quoted_to_name(module_name)

    env = ElixirScript.Translator.LexicalScope.add_import(env, module_name, options)

    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:alias, _, [{{:., _, [{:__aliases__, _, head_alias_name}, :{}]}, _, tail_aliases }]}, env) do
    env = Enum.reduce(tail_aliases, env, fn({:__aliases__, context, name}, acc) ->
      full_module_name = { :__aliases__, context, head_alias_name ++ name }

      module_name = Utils.quoted_to_name(full_module_name)
      alias_name = Utils.quoted_to_name({:__aliases__, [], [List.last(name)] })

      ElixirScript.Translator.LexicalScope.add_alias(acc, module_name, alias_name)
    end)

    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:alias, _, [{:__aliases__, _, _} = module_name] }, env) do
    {_, _, name} = module_name
    name = [List.last(name)]

    module_name = Utils.quoted_to_name(module_name)
    alias_name = Utils.quoted_to_name({:__aliases__, [], name })

    env = ElixirScript.Translator.LexicalScope.add_alias(env, module_name, alias_name)
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:alias, _, [{:__aliases__, _, _} = module_name, [as: {:__aliases__, _, _} = alias_name]]}, env) do
    module_name = Utils.quoted_to_name(module_name)
    alias_name = Utils.quoted_to_name(alias_name)

    env = ElixirScript.Translator.LexicalScope.add_alias(env, module_name, alias_name)
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:require, _, [{{:., _, [{:__aliases__, _, head_require_name}, :{}]}, _, tail_requires }]}, env) do
    env = Enum.reduce(tail_requires, env, fn({:__aliases__, context, name}, acc) ->
      full_module_name = { :__aliases__, context, head_require_name ++ name }

      module_name = Utils.quoted_to_name(full_module_name)
      ElixirScript.Translator.LexicalScope.add_require(acc, module_name)
    end)

    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:require, _, [{:__aliases__, _, _} = module_name] }, env) do
    module_name = Utils.quoted_to_name(module_name)
    env = ElixirScript.Translator.LexicalScope.add_require(env, module_name)
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:require, _, [{:__aliases__, _, _} = module_name, [as: {:__aliases__, _, _} = alias_name]]}, env) do
    module_name = Utils.quoted_to_name(module_name)
    alias_name = Utils.quoted_to_name(alias_name)

    env = ElixirScript.Translator.LexicalScope.add_require(env, module_name, alias_name)
    { %ElixirScript.Translator.Empty{}, env }
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

  defp do_translate({:receive, _, _ }, _) do
    raise ElixirScript.Translator.UnsupportedError, "receive"
  end

  defp do_translate({:{}, _, elements}, env) do
    quoted = quote do
      JS.new(Bootstrap.Core.Tuple, unquote(elements))
    end

    translate(quoted, env)
  end

  defp do_translate({:=, _, [left, right]}, env) do
    Match.make_match(left, right, env)
  end

  defp do_translate({function, _, [{:when, _, [{name, _, _params} | _guards] }, _] } = ast, env) when function in @generator_types do
    Def.process_function(name, [ast], %{ env | context: :generator})
  end

  defp do_translate({function, _, [{name, _, params}, _]} = ast, env) when function in @generator_types and is_atom(params) do
    Def.process_function(name, [ast], %{ env | context: :generator})
  end

  defp do_translate({function, _, [{name, _, _params}, _]} = ast, env) when function in @generator_types do
    Def.process_function(name, [ast], %{ env | context: :generator})
  end

  defp do_translate({function, _, [{:when, _, [{name, _, _params} | _guards] }, _] } = ast, env) when function in @function_types do
    Def.process_function(name, [ast], env)
  end

  defp do_translate({function, _, [{name, _, params}, _]} = ast, env) when function in @function_types and is_atom(params) do
    Def.process_function(name, [ast], env)
  end

  defp do_translate({function, _, [{name, _, _params}, _]} = ast, env) when function in @function_types do
    Def.process_function(name, [ast], env)
  end

  defp do_translate({:defdelegate, _, [{name, _, params}, options]}, env) do
    Def.process_delegate(name, params, options, env)
  end

  defp do_translate({:defstruct, _, attributes}, env) do
    { Struct.make_defstruct(attributes, env), env }
  end

  defp do_translate({:defexception, _, attributes}, env) do
    { Struct.make_defexception(attributes, env), env }
  end

  defp do_translate({:defmodule, _, [{:__aliases__, _, module_name_list}, [do: body]]}, env) do
    { Defmodule.make_module(module_name_list, body, env), env }
  end

  defp do_translate({:defprotocol, _, _}, env) do
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:defmacro, _, _}, env) do
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:defmacrop, _, _}, env) do
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:defimpl, _, _}, env) do
    { %ElixirScript.Translator.Empty{}, env }
  end

  defp do_translate({:|, _, [item, list]}, env) do
    quoted = quote do
      [unquote(item)].concat(unquote(list))
    end

    translate(quoted, env)
  end

  defp do_translate({:raise, _, [alias_info, attributes]}, env) when is_list(attributes) do
    js_ast = JS.throw_statement(
      Struct.new_struct(alias_info, {:%{}, [], attributes }, env)
    )

    { js_ast, env }
  end

  defp do_translate({:raise, _, [alias_info, message]}, env) do
    js_ast = JS.throw_statement(
      Struct.new_struct(alias_info, {:%{}, [], [message: message] }, env)
    )

    { js_ast, env }
  end

  defp do_translate({:raise, _, [message]}, env) do
    js_ast = JS.throw_statement(
      JS.object_expression(
        [
          Map.make_property(translate!(:__struct__, env), translate!(:RuntimeError, env)),
          Map.make_property(translate!(:__exception__, env), translate!(true, env)),
          Map.make_property(translate!(:message, env), translate!(message, env))
        ]
      )
    )

    { js_ast, env }
  end

  defp do_translate({name, _, params} = ast, env) when is_list(params) do
    if is_from_js_module(name, params, env) do
      do_translate({{:., [], [{:__aliases__, [], [:JS]}, name]}, [], params }, env)
    else
      expanded_ast = Macro.expand(ast, env.env)
      if expanded_ast == ast do
        name_arity = {name, length(params)}
        module = ElixirScript.Translator.State.get_module(env.state, env.module)

        cond do
          name_arity in module.functions or name_arity in module.private_functions ->
            Call.make_function_call(name, params, env)
          ElixirScript.Translator.LexicalScope.find_module(env, name_arity) ->
            imported_module_name = ElixirScript.Translator.LexicalScope.find_module(env, name_arity)
            Call.make_function_call(imported_module_name, name, params, env)
          true ->
            Call.make_function_call(name, params, env)
        end

      else
        translate(expanded_ast, env)
      end
    end
  end

  defp do_translate({ name, _, params }, env) when is_atom(params) do
      cond do
        is_from_js_module(name, params, env) ->
          do_translate({{:., [], [{:__aliases__, [], [:JS]}, name]}, [], params }, env)
        ElixirScript.Translator.LexicalScope.has_var?(env, name) ->
          { Identifier.make_identifier(name), env }
        has_function?(env.module, {name, 0}, env) ->
          Call.make_function_call(name, [], env)
        ElixirScript.Translator.LexicalScope.find_module(env, {name, 0}) ->
          imported_module_name = ElixirScript.Translator.LexicalScope.find_module(env, {name, 0})
          Call.make_function_call(imported_module_name, name, params, env)
        true ->
          { Identifier.make_identifier(name), env }
      end
  end

  defp is_from_js_module(name, params, env) do
    func = if is_list(params) do
      {name, length(params)}
    else
      {name, 0}
    end

    {_, macros} = Enum.find(env.env.macros, {nil, []}, fn({k, v}) -> to_string(k) == "Elixir.JS" end)
    {_, functions} = Enum.find(env.env.functions, {nil, []}, fn({k, v}) -> to_string(k) == "Elixir.JS" end)

    js = macros ++ functions

    if func in js do
      true
    else
      false
    end
  end

  def create_module_name(module_name, env) do
    case module_name do
      {:__aliases__, _, _} ->
        candiate_module_name = ElixirScript.Translator.State.get_module_name(env.state,
        Utils.quoted_to_name(module_name))

        if ElixirScript.Translator.LexicalScope.get_module_name(env, candiate_module_name) in ElixirScript.Translator.State.list_module_names(env.state) do
          ElixirScript.Translator.LexicalScope.get_module_name(env, candiate_module_name)
        else
          module_name
        end
      _ ->
        module_name
    end
  end

  def has_function?(module_name, name_arity, env) do
    case ElixirScript.Translator.State.get_module(env.state, module_name) do
      nil ->
        false
      module ->
        name_arity in module.functions or name_arity in module.private_functions
    end
  end

end
