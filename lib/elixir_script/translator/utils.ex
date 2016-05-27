defmodule ElixirScript.Translator.Utils do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Identifier

  def make_module_expression_tree([module], computed, env) do
    make_module_expression_tree(module, computed, env)
  end

  def make_module_expression_tree(modules, computed, _) when is_list(modules) do
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

  def make_module_expression_tree(module, _computed, _) when is_binary(module) or is_atom(module) do
    Identifier.make_identifier(module)
  end

  def make_module_expression_tree(module, _computed, env) do
    Translator.translate!(module, env)
  end

  def make_call_expression(module_name, function_name, params, env) do
    JS.call_expression(
      make_member_expression(module_name, function_name, env),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

  def make_call_expression(function_name, params, env) when is_tuple(function_name) do
    JS.call_expression(
      Translator.translate!(function_name, env),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

  def make_call_expression(function_name, params, env) do
    JS.call_expression(
      Identifier.make_identifier(function_name),
      Enum.map(params, &Translator.translate!(&1, env))
    )
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

  def quoted_to_name(the_alias) do
    {name, _} = Code.eval_quoted(the_alias)
    name
  end

  def name_to_quoted(name) do
    name = name
    |> Atom.to_string
    |> String.split(".")
    |> tl
    |> Enum.map(fn x -> String.to_atom(x) end)

    { :__aliases__, [], name }
  end

  def name_to_js_name(name) do
    { :__aliases__, _, name } = name_to_quoted(name)
    Enum.join([:Elixir] ++ name, "$")
  end

  def name_to_js_file_name(name) do
    { :__aliases__, _, name } = name_to_quoted(name)
    Enum.join([:Elixir] ++ name, ".")
  end

  def make_local_file_path(file_name) do
    root = ElixirScript.Translator.State.get().compiler_opts.root

    case root do
      nil ->
        "./" <> file_name
      root ->
        root <> "/" <> file_name
    end
  end

  def make_local_file_path(file_name, root) do
    case root do
      nil ->
        "./" <> file_name
      root ->
        root <> "/" <> file_name
    end
  end

end
