defmodule ElixirScript.Experimental.Forms.For do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Experimental.Clause
  alias ElixirScript.Experimental.Forms.{Pattern}

 def compile({:for, _, generators}) do
    args = handle_args(generators)

    generators = JS.array_expression(args.generators)

    into = args.into || JS.array_expression([])
    filter = args.filter || JS.function_expression([], [], JS.block_statement([JS.return_statement(JS.identifier("true"))]))
    fun = args.fun


    expression = JS.call_expression(
      JS.member_expression(
        JS.member_expression(
            JS.member_expression(
              JS.identifier("Bootstrap"),
              JS.identifier("Core")
            ),
            JS.identifier("Patterns")
          ),
        JS.identifier("clause")
      ),
      [JS.array_expression(args.patterns), fun, filter]
    )

    collectable = JS.member_expression(
      JS.identifier("Elixir"),
      JS.identifier("Collectable")
    )

    JS.call_expression(
      JS.member_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Core"),
            JS.identifier("SpecialForms")
          )
        ),
        JS.identifier("_for")
      ),
      [expression, generators, collectable, into]
    )
  end

  defp handle_args(generators) do
    Enum.reduce(generators, %{generators: [], args: [], filter: nil, fun: nil, into: nil, patterns: []}, fn

      ({:<<>>, _, body}, state) ->
        {bs_parts, collection} = Enum.map_reduce(body, nil, fn
      {:::, _, _} = ast, state ->
        {ast, state}
      {:<-, _, [var, collection]}, _ ->
        {var, collection}
      end)

      {patterns, params} = Pattern.compile([{:<<>>, [], bs_parts}])

      gen = JS.call_expression(
        JS.member_expression(
          JS.member_expression(
              JS.member_expression(
                JS.identifier("Bootstrap"),
                JS.identifier("Core")
              ),
              JS.identifier("Patterns")
            ),
          JS.identifier("bitstring_generator")
        ),
        [hd(patterns), Form.compile(collection)]
      )

      %{state | generators: state.generators ++ [gen], args: state.args ++ params, patterns: state.patterns ++ patterns}

      ({:<-, _, [identifier, enum]}, state) ->
        {patterns, params} = Pattern.compile([identifier])

        gen = JS.call_expression(
          JS.member_expression(
            JS.member_expression(
                JS.member_expression(
                  JS.identifier("Bootstrap"),
                  JS.identifier("Core")
                ),
                JS.identifier("Patterns")
              ),
            JS.identifier("list_generator")
          ),
          [hd(patterns), Form.compile(enum)]
        )

        %{state | generators: state.generators ++ [gen], args: state.args ++ params, patterns: state.patterns ++ patterns}
      ([into: expression], state) ->
        %{state | into: Form.compile(expression)}

      ([into: expression, do: expression2], state) ->
        fun = create_function_expression(expression2, state)

        %{state | into: Form.compile(expression), fun: fun}

      ([do: expression], state) ->
        fun = create_function_expression(expression, state)

        %{state | fun: fun}
      (filter, state) ->
        fun = create_function_expression(filter, state)

        %{state | filter: fun}
    end)
  end


  defp create_function_expression(ast, state) do
    ast = Enum.map(List.wrap(ast), &Form.compile(&1))
    |> Clause.return_last_statement

    JS.function_expression(
      state.args,
      [],
      JS.block_statement(ast)
    )
  end
end
