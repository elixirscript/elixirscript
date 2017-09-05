defmodule ElixirScript.Translate.Forms.With do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translate.{Function, Clause, Helpers}
  alias ElixirScript.Translate.Forms.Pattern


  def compile(args, module_state) do
    result = Enum.reduce(args, %{ expressions: [], arguments: [], module_state: module_state }, fn
      {symbol, _, [pattern, body] }, state when symbol in [:<-, :=] ->
        {ast, module_state} = Function.compile_block(body, state.module_state)
        body = Clause.return_last_statement(ast)
        expr_function = Helpers.arrow_function(state.arguments, JS.block_statement(body))

        { patterns, params, module_state } = Pattern.compile([pattern], module_state)

        %{state | arguments: state.arguments ++ params,
          expressions: state.expressions ++ [ JS.array_expression([hd(patterns), expr_function]) ],
          module_state: module_state
        }

      [do: expr], state ->
        expr_function = process_block(expr, state.arguments, state.module_state)

        %{state | expressions: state.expressions ++ [ expr_function ] }
      [do: do_expr, else: else_expr], state ->
        do_function = process_block(do_expr, state.arguments, state.module_state)

        { else_function, _ } = Function.compile({:fn, [], else_expr}, state.module_state)

        %{state | expressions: state.expressions ++ [ do_function, else_function ] }
    end)

    expressions = result.expressions

    js_ast = Helpers.call(
      JS.member_expression(
        Helpers.special_forms(),
        JS.identifier("_with")
      ),
      expressions
    )

    { js_ast, module_state }

  end


  defp process_block(body, arguments, module_state) do
    {ast, _} = Function.compile_block(body, module_state)

    body = Clause.return_last_statement(ast)
    Helpers.arrow_function(arguments, JS.block_statement(body))
  end
end
