defmodule ElixirScript.Translator.Utils do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  @js_reserved_words [
    :break,
    :case,
    :class,
    :const,
    :continue,
    :debugger,
    :default,
    :delete,
    :do,
    :else,
    :export,
    :extends,
    :finally,
    :function,
    :if,
    :import,
    :in,
    :instanceof,
    :new,
    :return,
    :super,
    :switch,
    :throw,
    :try,
    :typeof,
    :var,
    :void,
    :while,
    :with,
    :yield
  ]

  def inflate_groups(body) do
    Enum.map(body, fn(x) ->
      case x do
        %ElixirScript.Translator.Group{body: group_body} ->
          group_body
        %ESTree.BlockStatement{} ->
          %ESTree.BlockStatement{ body: inflate_groups(x.body) }
        %ESTree.IfStatement{} ->
          %{x | consequent: inflate_groups(x.consequent), alternate: inflate_groups(x.alternate) }
        _ ->
          x
      end
    end)
    |> List.flatten
  end

  def make_module_expression_tree([module], computed, env) do
    make_module_expression_tree(module, computed, env)
  end

  def make_module_expression_tree(modules, computed, _) when is_list(modules) do
    Enum.reduce(modules, nil, fn(x, ast) ->
      case ast do
        nil ->
          JS.member_expression(JS.identifier(x), nil, computed)
        %ESTree.MemberExpression{ property: nil } ->
          %{ ast | property: JS.identifier(x) }
        _ ->
          JS.member_expression(ast, JS.identifier(x), computed)
      end
    end)
  end

  def make_module_expression_tree(module, _computed, _) when is_binary(module) or is_atom(module) do
    JS.identifier(module)
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
      JS.identifier(function_name),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

  def make_member_expression(module_name, function_name, env, computed \\ false) do
    case module_name do
      modules when is_list(modules) and length(modules) > 1 ->
        ast = make_module_expression_tree(modules, computed, env)
        JS.member_expression(
          ast,
          JS.identifier(function_name),
          computed
        )
      modules when is_list(modules) and length(modules) == 1 ->
        JS.member_expression(
          JS.identifier(hd(modules)),
          JS.identifier(function_name),
          computed
        )
      {{:., _, [_module_name, _function_name]}, _, _params } = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          JS.identifier(function_name),
          computed
        )
      {{:., _, [{:__aliases__, _, _}]}, _, _} = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          JS.identifier(function_name),
          computed
        )
      {:., _, _} = ast ->
        JS.member_expression(
          Translator.translate!(ast, env),
          JS.identifier(function_name),
          computed
        )
      _ ->
        JS.member_expression(
          JS.identifier(module_name),
          JS.identifier(function_name),
          computed
        )
    end
  end

  def filter_name(reserved_word) when reserved_word in @js_reserved_words do
    "__#{Atom.to_string(reserved_word)}__"
  end

  def filter_name(name) do
    to_string(name)
    |> String.replace("?", "__qmark__")
    |> String.replace("!", "__emark__")
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
