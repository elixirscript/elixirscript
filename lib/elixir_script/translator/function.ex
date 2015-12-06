defmodule ElixirScript.Translator.Function do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.PatternMatching.Match
  alias ElixirScript.Preprocess.Variables

  @patterns JS.member_expression(
    JS.member_expression(
    JS.identifier("Elixir"),
    JS.identifier("Core")
    ),
    JS.identifier("Patterns")
  )

  @standard_libs [
    :Patterns, :Kernel, :Atom, :Enum, :Integer, :JS,
    :List, :Range, :Tuple, :Agent, :Keyword,
    :Base, :String, :Bitwise, :Collectable, :Enumerable,
    :Inspect, :Map, :MapSet, :Set, :VirtualDom, :View
  ]

  def update_alias({:__aliases__, context, [:List, :Chars]}) do
    {:__aliases__, context, [:Elixir] ++ [:List, :Chars] }
  end

  def update_alias({:__aliases__, context, [:String, :Chars]}) do
    {:__aliases__, context, [:Elixir] ++ [:String, :Chars] }
  end

  def update_alias({:__aliases__, context, [name | rest]}) when name in @standard_libs do
    {:__aliases__, context, [:Elixir, name] ++ rest }
  end

  def update_alias({:__aliases__, context, [name]}) when name in @standard_libs do
    {:__aliases__, context, [:Elixir, name] }
  end

  def update_alias({{:., context, [module_name, function_name]}, context2, params }) do
    {{:., context, [update_alias(module_name), function_name]}, context2, params }
  end

  def update_alias(ast) do
    ast
  end

  def module_in_standard_libs?(name) do
    name in @standard_libs
  end


  def process_function(name, functions, env) do
    result = make_anonymous_function(functions, env)

    declarator = JS.variable_declarator(
      JS.identifier(name),
      result
    )

    JS.variable_declaration([declarator], :const)
  end

  def make_anonymous_function(functions, env) do

    clauses = functions
    |> Stream.map(fn(x) -> Variables.process(x) end)
    |> Stream.map(fn
      {:->, _, [ [{:when, _, [params | guards]}], body ]} ->
        params = wrap_params(params)
        { patterns, params } = Match.build_match(List.wrap(params), env)
        params = make_params(params)
        body = make_function_body(body, env)
        guard_body = make_guards(guards, env)
        do_make_function_clause(patterns, params, body, guard_body)

      ({:->, _, [params, body]}) ->
        params = wrap_params(params)
        { patterns, params } = Match.build_match(params, env)
        params = make_params(params)
        body = make_function_body(body, env)
        do_make_function_clause(patterns, params, body)

      ({_, _, [{:when, _, [{_, _, params} | guards] }, [do: body]]}) ->
        params = wrap_params(params)
        { patterns, params } = Match.build_match(params, env)
        params = make_params(params)
        body = make_function_body(body, env)
        guard_body = make_guards(guards, env)
        do_make_function_clause(patterns, params, body, guard_body)

      ({_, _, [{_, _, params}, [do: body]]}) ->
        params = wrap_params(params)
        { patterns, params } = Match.build_match(params, env)
        params = make_params(params)
        body = make_function_body(body, env)
        do_make_function_clause(patterns, params, body)

      ({_, _, [{_, _, params}]}) ->
        params = wrap_params(params)
        { patterns, params } = Match.build_match(params, env)
        params = make_params(params)
        body = make_function_body([], env)
        do_make_function_clause(patterns, params, body)
    end)
    |> Enum.to_list

    make_defmatch(clauses)
  end

  def make_defmatch(clauses) do
    JS.call_expression(
      JS.member_expression(
        @patterns,
        JS.identifier("defmatch")
      ),
      clauses
    )
  end

  def wrap_params(params) when is_atom(params) do
    []
  end

  def wrap_params(params) do
    params
  end

  def make_function_body(body, env) do
    body
    |> prepare_function_body(env)
    |> JS.block_statement
  end

  defp make_guards(guards, env) do
    hd(List.wrap(guards))
    |> prepare_function_body(env)
    |> JS.block_statement
  end

  defp make_params(params) do
    Enum.filter(params, fn
      (%ESTree.Identifier{name: :undefined}) -> false
      (_) -> true
    end)
  end

  def do_make_function_clause(patterns, params, body, guard_body) do
    JS.call_expression(
      JS.member_expression(
        @patterns,
        JS.identifier("make_case")
      ),
      [
        JS.array_expression(patterns),
        JS.function_expression(params, [], body),
        JS.function_expression(params, [], guard_body)
      ]
    )
  end

  def do_make_function_clause(patterns, params, body) do
    JS.call_expression(
      JS.member_expression(
        @patterns,
        JS.identifier("make_case")
      ),
      [
        JS.array_expression(patterns),
        JS.function_expression(params, [], body)
      ]
    )
  end

  def make_function_or_property_call(module_name, function_name, env) do
    the_name = case update_alias(module_name) do
      {:__aliases__, _, _} = name  ->
        module_name = ElixirScript.Module.quoted_to_name(name)
        get_name_js_ast(module_name)

      {name, _, _} when is_atom(name) ->
        get_name_js_ast(name)

      {{:., _, [_module_name, _function_name]}, _, _params } = ast ->
        ast

      name ->
        name
    end

    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
        JS.identifier("Elixir"),
        JS.identifier("Core")
        ),
        JS.identifier("call_property")
      ),
      [
        Utils.make_module_expression_tree(the_name, false, env),
        Translator.translate(to_string(function_name), env)
      ]
    )
  end

  def make_function_call(function_name, params, env) when is_tuple(function_name) do
    Utils.make_call_expression(function_name, params, env)
  end

  def make_function_call(function_name, params, env) do
    Utils.make_call_expression(Utils.filter_name(function_name), params, env)
  end

  def make_function_call(module_name, function_name, params, env) do
    the_name = case update_alias(module_name) do
      {:__aliases__, _, name} ->
        module_name = ElixirScript.Module.quoted_to_name(name)
        get_name_js_ast(module_name)
      {name, _, _} when is_atom(name) ->
        get_name_js_ast(name)
      {{:., _, [_, _]}, _, _ } = ast ->
        ast
      {{:., _, [{:__aliases__, _, _}]}, _, _} = ast ->
        ast
      name ->
        name
    end

    Utils.make_call_expression(the_name, Utils.filter_name(function_name), params, env)
  end

  def prepare_function_body(body, env) do
    case body do
      nil ->
        []
      list when is_list(list) ->
        Enum.map(list, &Translator.translate(&1, env))
      {:__block__, _, list} ->
        Enum.map(list, &Translator.translate(&1, env))
      _ ->
        [Translator.translate(body, env)]
    end
    |> Utils.inflate_groups
    |> return_last_expression
  end

  def return_last_expression(nil) do
    nil
  end

  def return_last_expression([]) do
    [JS.return_statement(JS.literal(nil))]
  end

  def return_last_expression(%ESTree.BlockStatement{} = block) do
    %ESTree.BlockStatement{ block | body: return_last_expression(block.body) }
  end

  def return_last_expression(list) when is_list(list) do
    last_item = List.last(list)

    last_item = case last_item do
      %ESTree.Literal{} ->
        JS.return_statement(last_item)
      %ESTree.Identifier{} ->
        JS.return_statement(last_item)
      %ESTree.VariableDeclaration{} ->
        declaration = hd(last_item.declarations).id

        return_statement = case declaration do
          %ESTree.ArrayPattern{elements: elements} ->
            if(length(elements) == 1) do
              JS.return_statement(hd(declaration.elements))
            else
              JS.return_statement(JS.array_expression(declaration.elements))
            end
          _ ->
            JS.return_statement(declaration)
        end

        [last_item, return_statement]
      %ESTree.BlockStatement{} ->
        last_item = %ESTree.BlockStatement{ last_item | body: return_last_expression(last_item.body) }
      _ ->
        if String.contains?(last_item.type, "Expression") do
          JS.return_statement(last_item)
        else
          [last_item, JS.return_statement(JS.literal(nil))]
        end
    end


    list = Enum.take(list, length(list)-1)
    |> Enum.map(fn(x) ->
      case x do
        %ESTree.MemberExpression{} ->
          JS.expression_statement(x)
        %ESTree.CallExpression{} ->
          JS.expression_statement(x)
        _ ->
          x
      end
    end)

    if is_list(last_item) do
      list ++ last_item
    else
      list ++ [last_item]
    end
  end

  defp get_name_js_ast([Elixir | _] = list) do
    list
  end

  defp get_name_js_ast(module_name) when is_list(module_name) do
    ElixirScript.Module.quoted_to_name({:__aliases__, [], module_name})
    |> get_name_js_ast
  end

  defp get_name_js_ast(module_name) do
    cond do
      ElixirScript.State.get_module(module_name) ->
        ElixirScript.State.add_module_reference(Process.get(:current_module), module_name)
        ElixirScript.Module.name_to_js_name(module_name)

      ElixirScript.Module.has_alias?(ElixirScript.State.get_module(Process.get(:current_module)), module_name) ->
        module = ElixirScript.State.get_module(Process.get(:current_module))
        {_, module_name } = ElixirScript.Module.get_alias(module, module_name)
        ElixirScript.State.add_module_reference(Process.get(:current_module), module_name)
        ElixirScript.Module.name_to_js_name(module_name)

      true ->
        case Atom.to_string(module_name) do
          "Elixir." <> _ ->
            {:__aliases__, _, name } = ElixirScript.Module.name_to_quoted(module_name)
            name
          _ ->
            module_name
        end
    end
  end
end
