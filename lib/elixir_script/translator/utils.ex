defmodule ElixirScript.Translator.Utils do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator

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

  def make_throw_statement(error_name, message) do
    Builder.throw_statement(
      Builder.new_expression(
        Builder.identifier(error_name),
        [
          Builder.literal(message)
        ]
      )
    )
  end

  def make_module_expression_tree([module], computed) do
    make_module_expression_tree(module, computed)
  end

  def make_module_expression_tree(modules, computed) when is_list(modules) do
    Enum.reduce(modules, nil, fn(x, ast) ->
      case ast do
        nil ->
          Builder.member_expression(Builder.identifier(x), nil, computed)
        %ESTree.MemberExpression{ property: nil } ->
          %{ ast | property: Builder.identifier(x) }
        _ ->
          Builder.member_expression(ast, Builder.identifier(x), computed)
      end
    end)
  end

  def make_module_expression_tree(module, _computed) when is_binary(module) or is_atom(module) do
    Builder.identifier(module)
  end

  def make_module_expression_tree(module, _computed) do
    Translator.translate(module)
  end

  def make_call_expression_with_ast_params(module_name, function_name, params) do
    Builder.call_expression(
      make_member_expression(module_name, function_name),
      params
    )
  end

  def make_call_expression(module_name, function_name, params) do
    Builder.call_expression(
      make_member_expression(module_name, function_name),
      Enum.map(params, &Translator.translate(&1))
    )
  end

  def make_call_expression(function_name, params) do
    Builder.call_expression(
      Builder.identifier(function_name),
      Enum.map(params, &Translator.translate(&1))
    )
  end

  def make_member_expression(module_name, function_name, computed \\ false) do
    case module_name do
      modules when is_list(modules) and length(modules) > 1 ->
        ast = make_module_expression_tree(modules, computed)
        Builder.member_expression(
          ast,
          build_function_name_ast(function_name),
          computed
        )
      modules when is_list(modules) and length(modules) == 1 ->
        Builder.member_expression(
          Builder.identifier(hd(modules)),
          build_function_name_ast(function_name),
          computed
        )
      {{:., _, [_module_name, _function_name]}, _, _params } = ast ->
        Builder.member_expression(
          Translator.translate(ast),
          build_function_name_ast(function_name),
          computed                 
        )
      {:., _, _} = ast ->
        Builder.member_expression(
          Translator.translate(ast),
          build_function_name_ast(function_name),
          computed                 
        )
      _ ->
        Builder.member_expression(
          Builder.identifier(module_name),
          build_function_name_ast(function_name),
          computed
        )              
    end
  end

  def build_function_name_ast(function_name) do
    Builder.identifier(function_name)
  end

  def make_array_accessor_call(name, index) do
    make_member_expression(name, index, true)
  end

  def wrap_in_function_closure(body) do
    the_body = case body do
      b when is_list(b) ->
        b
      _ ->
        [body]
    end

    Builder.call_expression(
      Builder.member_expression(
        Builder.function_expression([],[],
          Builder.block_statement(the_body)
        ),
        Builder.identifier("call")
      ),
      [Builder.identifier("this")]
    )
  end

  def make_match(pattern, expr) do
    Builder.call_expression(
      make_member_expression("Kernel", "match__qmark__"),
      [
        pattern,
        expr
      ]
    )
  end

  def make_match(pattern, expr, guard) do
    Builder.call_expression(
      make_member_expression("Kernel", "match__qmark__"),
      [
        pattern,
        expr,
        guard
      ]
    )
  end

  def filter_name(:in) do
    "__in__"
  end

  def filter_name(name) do
    to_string(name)
    |> String.replace("?", "__qmark__")
    |> String.replace("!", "__emark__")
  end

end
