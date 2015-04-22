defmodule ElixirScript.Translator.PatternMatching do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def bind({_left1, _left2} = two_tuple, right) do
    do_tuple_bind(Tuple.to_list(two_tuple), right)
  end

  def bind({:{}, _, elements}, right) do
    do_tuple_bind(elements, right)
  end

  def bind(left, right) do
    identifiers = Tuple.to_list(left)

    declarator = Builder.variable_declarator(
      Builder.identifier(hd(identifiers)),
      Translator.translate(right)
    )

    Builder.variable_declaration([declarator], :let)
  end

  defp do_tuple_bind(left, right) do
    ref = Builder.identifier("_ref")

    declarator = Builder.variable_declarator(
      ref,
      Translator.translate(right)
    )

    declaration = Builder.variable_declaration([declarator], :let)

    pattern_declarator = left
    |> Enum.map(&ElixirScript.Translator.translate(&1))
    |> Builder.array_pattern()
    |> Builder.variable_declarator(
      Builder.member_expression(
        ref,
        Builder.identifier("value")
      )
    )

    pattern_declaration = Builder.variable_declaration([pattern_declarator], :let)

    Builder.block_statement([declaration] ++ [pattern_declaration])
  end

  def process_match({one, two}) do
    process_match({:{}, [], [one, two]})
  end

  def process_match({:{}, _, elements}) do
    {:tuple, elements}
  end

  def process_match([{:|, _, [head, tail]}]) do
    {head, _, _} = head
    {tail, _, _} = tail

    {:list, head, tail}
  end

  def process_match(items) when is_list(items) do
    names = Enum.map(items, fn({name, _, _}) ->
      name
    end)

    {:list, names}
  end

  def process_match({:%, _, [{:__aliases__, _, name}, {:%{}, _, properties}]}) do
    variables = Enum.filter_map(properties, fn({_key, value}) -> 
      case Translator.translate(value) do
        %ESTree.Identifier{} ->
          true
        _ ->
          false
      end 
    end,
    fn({key, value}) -> 
      {variable_name, _, _} = value
      { key, variable_name }
    end)

    new_properties = Enum.map(properties, fn({key, value}) ->
      case Translator.translate(value) do
        %ESTree.Identifier{} ->
          {key, {:__aliases__, [], [:undefined]} }
        _ ->
          {key, value}
      end
    end)

    [Translator.translate({:%{}, [], [__struct__: name] ++ new_properties})] ++ variables
  end

  def process_match({:=, _, [value, {variable_name, _, _}]}) do
    result = process_match(value)

    if is_list(result) do
      result 
    else
      [result]
    end ++ [variable_name]
  end

  def process_match({:<>, _, [left, right]}) do
    { :concatenation, left, right }
  end

  def process_match({identifier, _, _}) do
    {:identifier, identifier}
  end

  def process_match(item) do
    {:other, item }
  end

  def build_pattern_matched_body(body, params, identifier_fn) do
    state = %{ index: 0, body: body }

    { params, state } = Enum.map_reduce(params, state, fn(p, current_state) ->

      { param, new_body } = do_build_pattern_matched_body(process_match(p), current_state.body, current_state.index, identifier_fn)
      { param, %{ current_state | index: current_state.index + 1, body: new_body } }

    end)

    { state.body, params }
  end

  defp do_build_pattern_matched_body({:identifier, param}, body, _index, _identifier_fn) do
    { Builder.identifier(param), body }
  end

  defp do_build_pattern_matched_body({ :concatenation, left, right }, body, index, identifier_fn) do
    param = Builder.identifier("_ref#{index}")
    {ident, _, _ } = right 

    declarator = Builder.variable_declarator(
      Builder.identifier(ident),
      Builder.call_expression(
        Builder.member_expression(
                    identifier_fn.(index),
          Builder.identifier(:slice)
        ),
        [
          Builder.binary_expression(
            :-,
            Builder.member_expression(
              Builder.literal(left),
              Builder.identifier(:length)
            ),
            Builder.literal(1)
          )
        ]

      )
    )

    declaration = Builder.variable_declaration([declarator], :let)   

    body = [
      Builder.if_statement(
        Builder.call_expression(
          Builder.member_expression(
            Utils.make_array_accessor_call("arguments", index),
            Builder.identifier(:startsWith) 
          ),
          [
            Builder.literal(left)
          ]               
        ),
        Builder.block_statement([declaration] ++ body)
      )
    ]

    { param, body }
  end

  defp do_build_pattern_matched_body({ :tuple, elements }, body, index, identifier_fn) do
    param = Builder.identifier("_ref#{index}")

    { declarations, _ } = Enum.map_reduce(elements, 0, fn({variable, _, _}, arguments_index) ->
      declarator = Builder.variable_declarator(
        Builder.identifier(variable),
        Builder.member_expression(
                    identifier_fn.(index),
          Builder.literal(arguments_index),
          true
        )

      )

      { Builder.variable_declaration([declarator], :let), arguments_index + 1 }
    end)

    body = [
      Builder.if_statement(
        Builder.call_expression(
          Utils.make_member_expression("Kernel", "is_tuple"),
          [
                      identifier_fn.(index),
          ]
        ),
        Builder.block_statement(declarations ++ body)
      )
    ] 

    { param, body }
  end

  defp do_build_pattern_matched_body({ :list, elements }, body, index, identifier_fn) when is_list(elements) do
    param = Builder.identifier("_ref#{index}")

    { declarations, _ } = Enum.map_reduce(elements, 0, fn(variable, arguments_index) ->
      declarator = Builder.variable_declarator(
        Builder.identifier(variable),
        Builder.member_expression(
                    identifier_fn.(index),
          Builder.literal(arguments_index),
          true
        )

      )

      { Builder.variable_declaration([declarator], :let), arguments_index + 1 }
    end)

    body = [
      Builder.if_statement(
        Builder.call_expression(
          Utils.make_member_expression("Kernel", "is_list"),
          [
                      identifier_fn.(index)
          ]
        ),
        Builder.block_statement(declarations ++ body)
      )
    ]


    { param, body }
  end


  defp do_build_pattern_matched_body({ :list, head, tail } , body, index, identifier_fn) do

    param = Builder.identifier("_ref#{index}")

    head_declarator = Builder.variable_declarator(
      Builder.identifier(head),
      Builder.call_expression(
        Utils.make_member_expression("Kernel", "hd"),
        [
                    identifier_fn.(index)
        ]
      )
    )

    head_declaration = Builder.variable_declaration([head_declarator], :let)

    tail_declarator = Builder.variable_declarator(
      Builder.identifier(tail),
      Builder.call_expression(
        Utils.make_member_expression("Kernel", "tl"),
        [
                    identifier_fn.(index)
        ]
      )
    )

    tail_declaration = Builder.variable_declaration([tail_declarator], :let)

    body = [
      Builder.if_statement(
        Builder.call_expression(
          Utils.make_member_expression("Kernel", "is_list"),
          [
                      identifier_fn.(index)
          ]
        ),
        Builder.block_statement([head_declaration, tail_declaration] ++ body)
      )
    ] 

    { param, body }
  end

  defp do_build_pattern_matched_body([the_param | variables], body, index, identifier_fn) do
    param = Builder.identifier("_ref#{index}")

    variables = Enum.map(variables, fn(x) ->
      case x do
        {key, variable_name} ->
          declarator = Builder.variable_declarator(
            Builder.identifier(variable_name),
            Builder.member_expression(
              identifier_fn.(index),
              Builder.identifier(key),
              false                   
            )
          )

          Builder.variable_declaration([declarator], :let) 
        _ ->
        declarator = Builder.variable_declarator(
          Builder.identifier(x),
          identifier_fn.(index)
        )

        Builder.variable_declaration([declarator], :let)             
      end
    end)

    body = [
      Builder.if_statement(
        Utils.make_match(
          the_param, 
          identifier_fn.(index)
        ),
        Builder.block_statement(variables ++ body)
      )
    ] 

    { param, body }
  end

  defp do_build_pattern_matched_body({:other, item }, body, index, identifier_fn) do
    param = Builder.identifier("_ref#{index}")
    body = [
      Builder.if_statement(
        Utils.make_match(
          Translator.translate(item),
          identifier_fn.(index)
        ),
        Builder.block_statement(body)
      )
    ]

    { param, body }
  end

end