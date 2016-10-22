defmodule ElixirScript.Translator.With do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.PatternMatching

  def make_with(args, env) do
    result = Enum.reduce(args, %{ expressions: [], arguments: [] }, fn
      {symbol, _, [pattern, expr] }, state when symbol in [:<-, :=] ->
        {body , _} = Function.prepare_function_body(expr, env)
        translated_body = JS.block_statement(body)
        expr_function = JS.function_expression(state.arguments, [], translated_body)

        { patterns, params, _ } = PatternMatching.process_match([pattern], env)

        %{state | arguments: state.arguments ++ params,
          expressions: state.expressions ++ [ JS.array_expression([hd(patterns), expr_function]) ] }

      [do: expr], state ->
        expr_function = process_do_block(expr, state.arguments, env)

        %{state | expressions: state.expressions ++ [ expr_function ] }
      [do: do_expr, else: else_expr], state ->
        do_function = process_do_block(do_expr, state.arguments, env)

        { else_function, _ } = Function.make_anonymous_function(else_expr, env)

        %{state | expressions: state.expressions ++ [ do_function, else_function ] }
    end)

    expressions = result.expressions

    js_ast = JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier("_with")
      ),
      expressions
    )

    { js_ast, env }

  end

  defp process_do_block(expr, arguments, env) do
    {body , _} = Function.prepare_function_body(expr, env)
    translated_body = JS.block_statement(body)
    JS.function_expression(arguments, [], translated_body)
  end
end
