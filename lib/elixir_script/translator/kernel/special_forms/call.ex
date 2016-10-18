defmodule ElixirScript.Translator.Call do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Identifier

  def make_module_name(module_name, env) do
    the_name = get_module_name_for_function(module_name, env)
    { make_module_expression_tree(the_name, false, env), env }
  end


  def make_function_or_property_call(module_name, function_name, env) do
    the_name = get_module_name_for_function(module_name, env)

    js_ast = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Elixir"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("Functions")
          )
        ),
        JS.identifier("call_property")
      ),
      [
        make_module_expression_tree(the_name, false, env),
        Translator.translate!(to_string(function_name), env)
      ]
    )

    { js_ast, env }
  end


  def get_module_name_for_function(module_name, env) do
    case module_name do
      {:__aliases__, _, name} ->
        module_name = Utils.quoted_to_name(name)
        get_js_name(module_name, env)
      {name, _, _} when is_atom(name) ->
        get_js_name(name, env)
      {{:., _, [_, _]}, _, _ } = ast ->
        ast
      {{:., _, [{:__aliases__, _, _}]}, _, _} = ast ->
        ast
      ast when is_list(ast) ->
        ast
      name ->
        get_js_name(name, env)
    end
  end


  def make_function_call(function_name, params, env) when is_tuple(function_name) do
    { make_call_expression(function_name, params, env), env }
  end

  def make_function_call(function_name, params, env) do
    { make_call_expression(function_name, params, env), env }
  end

  def make_function_call(module_name, function_name, params, env) when is_list(module_name) do
    call = JS.call_expression(
      JS.member_expression(
        Translator.translate!(module_name, env),
        Identifier.make_identifier(function_name)
      ),
      Enum.map(params, &Translator.translate!(&1, env))
    )

    { call, env }
  end

  def make_function_call(module_name, function_name, params, env) do
    the_name = get_module_name_for_function(module_name, env)
    { make_call_expression(the_name, function_name, params, env), env }
  end

  defp make_call_expression(module_name, function_name, params, env) do
    JS.call_expression(
      make_member_expression(module_name, function_name, env),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

  defp make_call_expression(function_name, params, env) when is_tuple(function_name) do
    JS.call_expression(
      Translator.translate!(function_name, env),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

  defp make_call_expression(function_name, params, env) do
    JS.call_expression(
      Identifier.make_identifier(function_name),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end


  def get_js_name([Elixir | _] = list, _) do
    list
  end

  def get_js_name({:__aliases__, _, _} = name, env) do
    Utils.quoted_to_name(name)
    |> get_js_name(env)
  end

  def get_js_name(module_name, env) when is_list(module_name) do
    Utils.quoted_to_name({:__aliases__, [], module_name})
    |> get_js_name(env)
  end

  def get_js_name(module_name, env) do

    cond do
      module_name in env.requires ->
        Utils.name_to_js_name(module_name)

      module_name in ElixirScript.Translator.State.list_module_names ->
        ElixirScript.Translator.State.add_module_reference(env.module, module_name)
        Utils.name_to_js_name(module_name)

      true ->
        case Atom.to_string(module_name) do
          "Elixir." <> _ ->
            {:__aliases__, _, name } = Utils.name_to_quoted(module_name)
            name
          _ ->
            module_name
        end
    end
  end


  def make_member_expression(module_name, function_name, env, computed \\ false) do
    case module_name do
      modules when is_list(modules) and length(modules) > 1 ->
        ast = make_module_expression_tree(modules, computed, env)
        JS.member_expression(
          ast,
          Identifier.make_identifier(function_name),
          computed
        )
      modules when is_list(modules) and length(modules) == 1 ->
        JS.member_expression(
          Identifier.make_identifier(hd(modules)),
          Identifier.make_identifier(function_name),
          computed
        )
      {{:., _, [_module_name, _function_name]}, _, _params } = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          Identifier.make_identifier(function_name),
          computed
        )
      {{:., _, [{:__aliases__, _, _}]}, _, _} = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          Identifier.make_identifier(function_name),
          computed
        )
      {:., _, _} = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          Identifier.make_identifier(function_name),
          computed
        )
      _ ->
        JS.member_expression(
          Identifier.make_identifier(module_name),
          Identifier.make_identifier(function_name),
          computed
        )
    end
  end

  defp make_module_expression_tree([module], computed, env) do
    make_module_expression_tree(module, computed, env)
  end

  defp make_module_expression_tree(modules, computed, _) when is_list(modules) do
    Enum.reduce(modules, nil, fn(x, ast) ->
      case ast do
        nil ->
          JS.member_expression(Identifier.make_identifier(x), nil, computed)
        %ESTree.MemberExpression{ property: nil } ->
          %{ ast | property: Identifier.make_identifier(x) }
        _ ->
          JS.member_expression(ast, Identifier.make_identifier(x), computed)
      end
    end)
  end

  defp make_module_expression_tree(module, _, _) when is_binary(module) or is_atom(module) do
    Identifier.make_identifier(module)
  end

  defp make_module_expression_tree(module, _, env) do
    Translator.translate!(module, env)
  end
end
