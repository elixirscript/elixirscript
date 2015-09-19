defmodule ElixirScript.Translator.For do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.PatternMatching.Match
  alias ElixirScript.Translator.Primitive
  alias ElixirScript.Translator.Function


  def make_for(generators, env) do
    args = handle_args(generators, env)

    collections = Primitive.make_list_no_translate(args.collections)
    into = args.into || Primitive.make_list_no_translate([])
    filter = args.filter || JS.function_expression([], [], JS.block_statement([JS.return_statement(JS.identifier("true"))]))
    fun = args.fun

    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Kernel"),
          JS.identifier("SpecialForms")
        ),
        JS.identifier("_for")
      ),
      [collections, fun, filter, into]
    )
  end

  defp handle_args(generators, env) do
    Enum.reduce(generators, %{collections: [], args: [], filter: nil, fun: nil, into: nil}, fn
      ({:<-, [], [identifier, enum]}, state) ->
        { patterns, params } = Match.build_match([identifier], env)

        list = Primitive.make_list_no_translate([hd(patterns), Translator.translate(enum, env)])

        %{state | collections: state.collections ++ [list], args: state.args ++ params }
      ([into: expression], state) ->
        %{ state | into: Translator.translate(expression, env) }
      ([into: expression, do: expression2], state) ->
        fun = JS.function_expression(
          state.args,
          [],
          Function.make_function_body(expression2, env)
        ) 

        %{ state | into: Translator.translate(expression, env), fun: fun }

      ([do: expression], state) ->

        fun = JS.function_expression(
          state.args,
          [],
          Function.make_function_body(expression, env)
        ) 

        %{ state | fun: fun }
      (filter, state) ->
        fun = JS.function_expression(
          state.args,
          [],
          Function.make_function_body(filter, env)
        )

        %{ state | filter: fun }  
    end)
  end  
end