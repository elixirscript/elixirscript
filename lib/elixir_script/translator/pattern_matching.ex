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
    case left do
      {:^, _, [{variable, meta, context}]} ->
        Builder.if_statement(
          Translator.translate(quote do: !Kernel.match__qmark__(unquote({variable, meta, context}), unquote(right))),
          Utils.make_throw_statement("MatchError", "no match of right hand side value")
        )
      _ ->
        declarator = case is_list(left) do
          true ->
            array = left
            |> Enum.map(&Translator.translate(&1))
            |> Builder.array_expression

            Builder.variable_declarator(
              array,
              Translator.translate(right)
            )

          false ->
            Builder.variable_declarator(
              Translator.translate(left),
              Translator.translate(right)
            )
        end

        Builder.variable_declaration([declarator], :let)
    end
  end

  defp do_tuple_bind(left, right) do
    ref = Builder.identifier("_ref")

    ref_declarator = Builder.variable_declarator(
      ref,
      Translator.translate(right)
    )

    ref_declaration = Builder.variable_declaration([ref_declarator], :let)

    {declarations, _} = Enum.map_reduce(left, 0, fn(x, index) -> 

      declaration = case x do
        {:^, _, [{variable, meta, context}]} ->
          bound = Builder.if_statement(
            Translator.translate(quote do: !Kernel.match__qmark__(unquote({variable, meta, context}), _ref.get(unquote(index)))),
            Utils.make_throw_statement("MatchError", "no match of right hand side value")
          )
          bound
        _ ->
        declarator = Builder.variable_declarator(
          Translator.translate(x),
          Builder.call_expression(
            Builder.member_expression(
              ref,
              Builder.identifier(:get)
            ),
            [Builder.literal(index)]
          )
        )

        Builder.variable_declaration([declarator], :let)
      end



      {declaration, index + 1}      
    end)
    
    %ElixirScript.Translator.Group{ body: [ref_declaration] ++ declarations }
  end

  def process_pattern({type, item}) when type in [:tuple, :list, :identifier, :other, :listhdtail] do
    {type, item}
  end

  def process_pattern({type, one, two}) when type in [:concatenation, :map] do
    {type, one, two}
  end

  def process_pattern({one, two}) do
    process_pattern({:{}, [], [one, two]})
  end

  def process_pattern({:{}, _, elements}) do
    {:tuple, Enum.map(elements, &process_pattern(&1))}
  end

  def process_pattern([{:|, _, [head, tail]}]) do
    {head, _, _} = head
    head = Utils.filter_name(head)

    {tail, _, _} = tail
    tail = Utils.filter_name(tail)

    { :listhdtail, [ process_pattern(head), process_pattern(tail) ] }
  end

  def process_pattern(items) when is_list(items) do
    names = Enum.map(items, fn(x) ->
      process_pattern(x)
    end)

    {:list, names}
  end

  def process_pattern({:%, _, [{:__aliases__, _, name}, {:%{}, _, properties}]}) do
    process_pattern({:%{}, [], [__struct__: name] ++ properties})
  end

  def process_pattern({:%{}, _, properties}) do
    variables = Enum.filter_map(properties, fn({_key, value}) -> 
      case Translator.translate(value) do
        %ESTree.Identifier{} ->
          true
        %ESTree.CallExpression{ callee: %ESTree.Identifier{ name: "List" } } ->
          false
        %ESTree.CallExpression{} ->
          true
        _ ->
          false
      end
    end,
    fn({key, value}) ->
      case process_pattern(value) do
        items when is_list(items) ->
          { key, tl(items) }
        pattern ->
          { key, pattern }
      end
    end)

    new_properties = Enum.map(properties, fn({key, value}) ->
      case Translator.translate(value) do
        %ESTree.Identifier{} ->
          {key, {:__aliases__, [], [:undefined]} }
        %ESTree.CallExpression{ callee: %ESTree.Identifier{ name: "List" } } ->
          {key, value}
        %ESTree.CallExpression{} ->
          {key, hd(process_pattern(value)) }
        _ ->
          {key, value}
      end
    end)

    [{:%{}, [], new_properties}] ++ variables
  end

  def process_pattern({:=, _, [value, {variable_name, _, _}]}) do
    result = process_pattern(value)

    variable_name = Utils.filter_name(variable_name)

    if is_list(result) do
      result 
    else
      [result]
    end ++ [{:item_identifier, variable_name}]
  end

  def process_pattern({:<>, _, [left, right]}) do
    { :concatenation, left, right }
  end

  def process_pattern({identifier, _, _}) do
    identifier = Utils.filter_name(identifier)
    {:identifier, identifier}
  end

  def process_pattern(item) do
    {:other, item }
  end

  def build_pattern_matched_body(body, params, identifier_fn, guards) do
    body = if guards do
      [Builder.if_statement(
        guards |> Enum.map(&Translator.translate(&1)) |> hd,
        Builder.block_statement(body)
      )
    ]
    else
      body
    end
    
    state = %{ index: 0, body: body }

    { params, state } = Enum.map_reduce(params, state, fn(p, current_state) ->

      { param, new_body } = do_build_pattern_matched_body(process_pattern(p), current_state.body, current_state.index, identifier_fn)
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

  defp do_build_pattern_matched_body({ type, elements }, body, index, identifier_fn) when type in [:tuple, :list] do
    state = %{ body: body, state_index: 0 }

    func = if type == :tuple, do: "is_tuple", else: "is_list"

    { declarations, state } = Enum.map_reduce(elements, state, fn(x, current_state) ->

      case x do
        { :identifier, item } ->


          
          declarator = Builder.variable_declarator(
                Builder.identifier(item),
                Builder.call_expression(
                  Builder.member_expression(
                    identifier_fn.(index),
                    Builder.identifier(:get)
                  ),
                  [Builder.literal(current_state.state_index)]
                )
              )
          declaration = Builder.variable_declaration([declarator], :let)

          {declaration, %{current_state | body: current_state.body, state_index: current_state.state_index + 1 }}
        params ->
          {new_body, _params} = build_pattern_matched_body(current_state.body, [params], 
            fn(new_index) ->
              Builder.call_expression(
                Builder.member_expression(
                  identifier_fn.(index),
                  Builder.identifier(:get)
                ),
                [Builder.literal(current_state.state_index + new_index)]
              )
          end, nil)

          {nil, %{current_state | body: new_body, state_index: current_state.state_index + 1 }}   
      end
    end)

    declarations = Enum.filter(declarations, fn(x) -> x != nil end)

    body = [
      Builder.if_statement(
        Builder.call_expression(
          Utils.make_member_expression("Kernel", func),
          [
            identifier_fn.(index),
          ]
        ),
        Builder.block_statement(declarations ++ state.body)
      )
    ] 

    { Builder.identifier("_ref#{index}"), body }
  end


  defp do_build_pattern_matched_body({ :listhdtail, [head, tail] } , body, index, identifier_fn) do
    param = Builder.identifier("_ref#{index}")

    head_declarator = Builder.variable_declarator(
      Builder.identifier(elem(head, 1)),
      Builder.call_expression(
        Utils.make_member_expression("Kernel", "hd"),
        [
          identifier_fn.(index)
        ]
      )
    )

    head_declaration = Builder.variable_declaration([head_declarator], :let)

    tail_declarator = Builder.variable_declarator(
      Builder.identifier(elem(tail, 1)),
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

    state = %{ body: body, state_index: 0 }

    { declarations, state } = Enum.map_reduce(variables, state, fn(x, current_state) ->
      case x do
        { :identifier, item } ->
          declarator = Builder.variable_declarator(
            Builder.identifier(item),
            Builder.member_expression(
              identifier_fn.(index),
              Builder.literal(current_state.state_index),
              true
            )
          )

          declaration = Builder.variable_declaration([declarator], :let)

          {declaration, %{current_state | body: current_state.body, state_index: current_state.state_index + 1 }}
        { :item_identifier, item } ->
          declarator = Builder.variable_declarator(
            Builder.identifier(item),
            identifier_fn.(index)
          )

          declaration = Builder.variable_declaration([declarator], :let)

          {declaration, %{current_state | body: current_state.body, state_index: current_state.state_index + 1 }}
        { key, { :identifier, item } } ->

          declarations = do_build_map_variables({ key, [{ :identifier, item }] }, [key], identifier_fn.(index))

          {declarations, %{current_state | body: current_state.body, state_index: current_state.state_index + 1 }}
        { key, items }->
          declarations = do_build_map_variables({ key, items }, [key], identifier_fn.(index))
          {declarations, %{current_state | body: current_state.body, state_index: current_state.state_index + 1 }}
        params ->
          params = case x do
            atom when is_atom(atom) ->
              { :identifier, atom }
            _ ->
              params
          end

          {new_body, _params} = build_pattern_matched_body(current_state.body, [params], 
            fn(new_index) ->
              Builder.member_expression(
                identifier_fn.(index),
                Builder.literal(current_state.state_index + new_index),
                true
              )
          end, nil)

          {nil, %{current_state | body: new_body, state_index: current_state.state_index + 1 }}   
      end
    end)

    declarations = Enum.filter(declarations, fn(x) -> x != nil end) 
    |> List.flatten

    body = [
      Builder.if_statement(
        Utils.make_match(
          Translator.translate(the_param), 
          identifier_fn.(index)
        ),
        Builder.block_statement(declarations ++ state.body)
      )
    ] 

    { Builder.identifier("_ref#{index}"), body }
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

  def do_build_map_variables({ key, items }, keys, identifier) do
      declarations = Enum.map(items, fn(x) ->
        case x do
          {:identifier, value} ->
            declarator = Builder.variable_declarator(
              Builder.identifier(value),
              build_member_expression_tree(keys, identifier)
            )

            Builder.variable_declaration([declarator], :let)
          {key, {:identifier, value} }->
            declarator = Builder.variable_declarator(
              Builder.identifier(value),
              build_member_expression_tree(keys ++ [key], identifier)
            )

            Builder.variable_declaration([declarator], :let) 
          {key, items }->
            do_build_map_variables({key, items }, keys ++ [key], identifier)        
          items when is_list(items) ->
            do_build_map_variables(x, keys ++ [key], identifier)
        end

      end)

      List.flatten(declarations)
  end

  def build_member_expression_tree(keys, ast) do
    Enum.reduce(keys, ast, fn(x, current_ast) -> 
      Builder.member_expression(
        current_ast,
        Builder.literal(to_string(x)),
        true
      )
    end)
  end



end