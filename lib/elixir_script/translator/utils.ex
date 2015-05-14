defmodule ElixirScript.Translator.Utils do
  alias ESTree.Builder
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
        ast = Enum.chunk(modules, 2)
        |> Enum.reduce(nil, fn(x, ast) ->
          case x do
            [one] ->
              if is_nil(ast) do
                Builder.identifier(one)
              else
                Builder.member_expression(
                  ast,
                  Builder.identifier(one),
                  computed
                )
              end
            [one, two] ->
              if is_nil(ast) do
                Builder.member_expression(
                  Builder.identifier(one),
                  Builder.identifier(two),
                  computed
                )
              else
                Builder.member_expression(
                  ast,
                  Builder.member_expression(
                    Builder.identifier(one),
                    Builder.identifier(two),
                    computed
                  ),
                  computed
                )
              end
          end
        end)

        Builder.member_expression(
          ast,
          Builder.identifier(function_name),
          computed
        )        
      _ ->
        Builder.member_expression(
          Builder.identifier(module_name),
          Builder.identifier(function_name),
          computed
        )              
    end
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

    Builder.expression_statement(
      Builder.call_expression(
        Builder.function_expression([],[],
          Builder.block_statement(the_body)
        ),
        []
      )
    )
  end

  def make_match(pattern, expr) do
    Builder.call_expression(
      make_member_expression("Kernel", "match"),
      [
        pattern,
        expr
      ]
    )
  end

  def make_match(pattern, expr, guard) do
    Builder.call_expression(
      make_member_expression("Kernel", "match"),
      [
        pattern,
        expr,
        guard
      ]
    )
  end

end