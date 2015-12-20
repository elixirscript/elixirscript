defmodule ElixirScript.Translator.For do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.PatternMatching.Match
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Function


  def make_for(generators, env) do
    args = handle_args(generators, env)

    collections = Primitive.make_list_no_translate(args.collections)
    into = args.into || Primitive.make_list_no_translate([])
    filter = args.filter || JS.function_expression([], [], JS.block_statement([JS.return_statement(JS.identifier("true"))]))
    fun = args.fun

    js_ast = JS.call_expression(
      JS.member_expression(
        Primitive.special_forms(),
        JS.identifier("_for")
      ),
      [collections, fun, filter, into]
    )

    { js_ast, env }
  end

  defp handle_args(generators, env) do
    Enum.reduce(generators, %{collections: [], args: [], filter: nil, fun: nil, into: nil}, fn
      ({:<-, [], [identifier, enum]}, state) ->
        { patterns, params, env } = Match.process_match([identifier], env)

        list = Primitive.make_list_no_translate([hd(patterns), Translator.translate!(enum, env)])

        %{state | collections: state.collections ++ [list], args: state.args ++ params }
      ([into: expression], state) ->
        %{ state | into: Translator.translate(expression, env) }

      ([into: expression, do: expression2], state) ->
        fun = create_function_expression(expression2, env, state)

        %{ state | into: Translator.translate!(expression, env), fun: fun }

      ([do: expression], state) ->
        fun = create_function_expression(expression, env, state)

        %{ state | fun: fun }
      (filter, state) ->
        fun = create_function_expression(filter, env, state)

        %{ state | filter: fun }
    end)
  end


  defp create_function_expression(ast, env, state) do
    { ast, _ } = Function.make_function_body(ast, env)

    JS.function_expression(
      state.args,
      [],
      ast
    )
  end
end
