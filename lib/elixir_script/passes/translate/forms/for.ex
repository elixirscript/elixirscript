defmodule ElixirScript.Translate.Forms.For do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translate.{Form, Clause, Helpers, Identifier}
  alias ElixirScript.Translate.Forms.Pattern

 def compile({:for, _, generators}, state) do
    args = handle_args(generators, state)

    generators = JS.array_expression(args.generators)

    into = args.into || JS.array_expression([])
    filter = args.filter || Helpers.arrow_function([], JS.block_statement([JS.return_statement(JS.identifier("true"))]))
    fun = args.fun


    expression = Helpers.call(
      JS.member_expression(
        Helpers.patterns(),
        JS.identifier("clause")
      ),
      [JS.array_expression(args.patterns), fun, filter]
    )

    members = ["Elixir", "Collectable" , "__load"]

    collectable = Helpers.call(
      Identifier.make_namespace_members(members),
      [JS.identifier("Elixir")]
    )

    ast = Helpers.call(
      JS.member_expression(
        Helpers.special_forms(),
        JS.identifier("_for")
      ),
      [expression, generators, collectable, into]
    )

    {ast, state}
  end

  defp handle_args(nil, _) do
    %{generators: [], args: [], filter: nil, fun: nil, into: nil, patterns: []}
  end

  defp handle_args(generators, module_state) do
    Enum.reduce(generators, %{generators: [], args: [], filter: nil, fun: nil, into: nil, patterns: []}, fn

      ({:<<>>, _, body}, state) ->
        {bs_parts, collection} = Enum.map_reduce(body, nil, fn
                                                              {:::, _, _} = ast, state ->
                                                                {ast, state}
                                                              {:<-, _, [var, collection]}, _ ->
                                                                {var, collection}
                                                              end)

      {patterns, params, module_state} = Pattern.compile([{:<<>>, [], bs_parts}], module_state)

      gen = Helpers.call(
        JS.member_expression(
          Helpers.patterns(),
          JS.identifier("bitstring_generator")
        ),
        [hd(patterns), Form.compile!(collection, module_state)]
      )

      %{state | generators: state.generators ++ [gen], args: state.args ++ params, patterns: state.patterns ++ patterns}

      ({:<-, _, [identifier, enum]}, state) ->
        {patterns, params, module_state} = Pattern.compile([identifier], module_state)

        gen = Helpers.call(
          JS.member_expression(
            Helpers.patterns(),
            JS.identifier("list_generator")
          ),
          [hd(patterns), Form.compile!(enum, module_state)]
        )

        %{state | generators: state.generators ++ [gen], args: state.args ++ params, patterns: state.patterns ++ patterns}
      ([into: expression], state) ->
        %{state | into: Form.compile!(expression, module_state)}

      ([into: expression, do: expression2], state) ->
        fun = create_function_expression(expression2, state, module_state)

        %{state | into: Form.compile!(expression, module_state), fun: fun}

      ([do: expression], state) ->
        fun = create_function_expression(expression, state, module_state)

        %{state | fun: fun}
      (filter, state) ->
        fun = create_function_expression(filter, state, module_state)

        %{state | filter: fun}
    end)
  end


  defp create_function_expression(ast, state, module_state) do
    { ast, _ } = Enum.map_reduce(List.wrap(ast), module_state, fn x, acc_state ->
       Form.compile(x, acc_state)
    end)

    ast = ast
    |> List.flatten
    |> Clause.return_last_statement

    Helpers.arrow_function(
      state.args,
      JS.block_statement(ast)
    )
  end
end
