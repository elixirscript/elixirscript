defmodule ElixirScript.Translator.Function do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def make_function_or_property_call(module_name, function_name) do        
        params = [
          module_name,
          to_string(function_name)
        ]

    Utils.make_call_expression("ElixirScript", "get_property_or_call_function", params)
  end

  def make_function_call(function_name, params) do
    Builder.call_expression(
      Builder.identifier(function_name),
      Enum.map(params, &Translator.translate(&1))
    )
  end

  def make_function_call(module_name, function_name, params) do
    the_name = case module_name do
      {:__aliases__, _, name} ->
        name
      {name, _, _} ->
        name
      name ->
        case to_string(name) do
          "Elixir." <> actual_name ->
            actual_name
          _ ->
            name
        end
    end

    Utils.make_call_expression(the_name, function_name, params)
  end

  def make_function(name, params, body, guards \\ nil) do
    do_make_function(name, params, body, guards)
  end

  def make_export_function(name, params, body, guards \\ nil) do
    do_make_function(name, params, body, guards)
    |> Builder.export_declaration
  end

  defp do_make_function(name, params, body, guards \\ nil) do
    { body, params } = prepare_function_body(body) |> handle_pattern_matching(name, params)

    body = if guards do
      [Builder.if_statement(
        guards |> Enum.map(&Translator.translate(&1)) |> hd,
        Builder.block_statement(body)
      )
    ]
    else
      body
    end

    Builder.function_declaration(
      Builder.identifier(name),
      params,
      [],
      Builder.block_statement(body)
    )
  end

  def make_anonymous_function(params, body) do
    Builder.function_expression(
      Enum.map(params, &Translator.translate(&1)),
      [],
      Builder.block_statement(prepare_function_body(body))
    )
  end

  defp handle_pattern_matching(body, name, params) do
    state = %{ index: 0, body: body }

    { params, state } = Enum.map_reduce(params, state, fn(p, current_state) ->

      translated = process_param(p)

      case translated do
        %ESTree.Identifier{} ->
          { translated, %{ current_state | index: current_state.index + 1 } }
        { :concatenation, left, right } ->
          param = Builder.identifier("_ref#{current_state.index}")
          {ident, _, _ } = right 

          declarator = Builder.variable_declarator(
            Builder.identifier(ident),
            Builder.call_expression(
              Builder.member_expression(
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true                  
                ),
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
                  Builder.member_expression(
                    Builder.identifier("arguments"),
                    Builder.literal(current_state.index),
                    true
                  ),
                  Builder.identifier(:startsWith) 
                ),
                [
                  Builder.literal(left)
                ]               
              ),
              Builder.block_statement([declaration] ++ current_state.body)
            )
          ]     

          { param, %{ current_state | index: current_state.index + 1, body: body } }
        { :tuple, elements } ->
          param = Builder.identifier("_ref#{current_state.index}")


          { declarations, _ } = Enum.map_reduce(elements, 0, fn({variable, _, _}, index) ->
            declarator = Builder.variable_declarator(
              Builder.identifier(variable),
              Builder.member_expression(
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true
                ),
                Builder.literal(index),
                true
              )

            )

            { Builder.variable_declaration([declarator], :let), index + 1 }
          end)

          body = [
            Builder.if_statement(
              Builder.call_expression(
                Builder.member_expression(
                  Builder.identifier("Kernel"),
                  Builder.identifier("is_tuple")
                ),
                [
                  Builder.member_expression(
                    Builder.identifier("arguments"),
                    Builder.literal(current_state.index),
                    true
                  )
                ]
              ),
              Builder.block_statement(declarations ++ current_state.body)
            )
          ]  

          { param, %{ current_state | index: current_state.index + 1, body: body } }
        { :list, elements } when is_list(elements) ->
          param = Builder.identifier("_ref#{current_state.index}")


          { declarations, _ } = Enum.map_reduce(elements, 0, fn(variable, index) ->
            declarator = Builder.variable_declarator(
              Builder.identifier(variable),
              Builder.member_expression(
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true
                ),
                Builder.literal(index),
                true
              )

            )

            { Builder.variable_declaration([declarator], :let), index + 1 }
          end)

          body = [
            Builder.if_statement(
              Builder.call_expression(
                Builder.member_expression(
                  Builder.identifier("Kernel"),
                  Builder.identifier("is_list")
                ),
                [
                  Builder.member_expression(
                    Builder.identifier("arguments"),
                    Builder.literal(current_state.index),
                    true
                  )
                ]
              ),
              Builder.block_statement(declarations ++ current_state.body)
            )
          ]  

          { param, %{ current_state | index: current_state.index + 1, body: body } }
        { :list, head, tail } ->
          param = Builder.identifier("_ref#{current_state.index}")


          head_declarator = Builder.variable_declarator(
            Builder.identifier(head),
            Builder.call_expression(
              Builder.member_expression(
                Builder.identifier("Kernel"),
                Builder.identifier("hd")
              ),
              [
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true
                )
              ]
            )
          )

          head_declaration = Builder.variable_declaration([head_declarator], :let)

          tail_declarator = Builder.variable_declarator(
            Builder.identifier(tail),
            Builder.call_expression(
              Builder.member_expression(
                Builder.identifier("Kernel"),
                Builder.identifier("tl")
              ),
              [
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true
                )
              ]
            )
          )

          tail_declaration = Builder.variable_declaration([tail_declarator], :let)

          body = [
            Builder.if_statement(
              Builder.call_expression(
                Builder.member_expression(
                  Builder.identifier("Kernel"),
                  Builder.identifier("is_list")
                ),
                [
                  Builder.member_expression(
                    Builder.identifier("arguments"),
                    Builder.literal(current_state.index),
                    true
                  )
                ]
              ),
              Builder.block_statement([head_declaration, tail_declaration] ++ current_state.body)
            )
          ]  

          { param, %{ current_state | index: current_state.index + 1, body: body } }
        [the_param | variables] ->
          param = Builder.identifier("_ref#{current_state.index}")

          variables = Enum.map(variables, fn(x) ->
            case x do
              {key, variable_name} ->
                declarator = Builder.variable_declarator(
                  Builder.identifier(variable_name),
                  Builder.member_expression(
                    Builder.member_expression(
                      Builder.identifier("arguments"),
                      Builder.literal(current_state.index),
                      true
                    ),
                    Builder.identifier(key),
                    false                   
                  )
                )

                Builder.variable_declaration([declarator], :let) 
              _ ->
              declarator = Builder.variable_declarator(
                Builder.identifier(x),
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true
                )
              )

              Builder.variable_declaration([declarator], :let)             
            end
          end)

          body = [
            Builder.if_statement(
              Utils.make_match(
                the_param, 
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true
                )
              ),
              Builder.block_statement(variables ++ current_state.body)
            )
          ]

        { param, %{ current_state | index: current_state.index + 1, body: body } }
        _ ->
          param = Builder.identifier("_ref#{current_state.index}")
          body = [
            Builder.if_statement(
              Utils.make_match(
                translated, 
                Builder.member_expression(
                  Builder.identifier("arguments"),
                  Builder.literal(current_state.index),
                  true
                )
              ),
              Builder.block_statement(current_state.body)
            )
          ]

        { param, %{ current_state | index: current_state.index + 1, body: body } }
      end
    end)

    { state.body, params }
  end

  defp process_param(p) do
    case p do
      {one, two} ->
        process_param({:{}, [], [one, two]})
      {:{}, _, elements} ->
        {:tuple, elements}
      [{:|, _, [head, tail]}] ->
        {head, _, _} = head
        {tail, _, _} = tail

        {:list, head, tail}
      items when is_list(items) ->
        names = Enum.map(items, fn({name, _, _}) ->
          name
        end)

        {:list, names}
      {:%, _, [{:__aliases__, _, name}, {:%{}, _, properties}]} ->
        variables = Enum.filter_map(properties, fn({key, value}) -> 
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
      {:=, _, [value, {variable_name, _, _}]} ->
        result = process_param(value)

        if is_list(result) do
          result 
        else
          [result]
        end ++ [variable_name]
      {:<>, _, [left, right]} ->
        { :concatenation, left, right }
      _ ->
        Translator.translate(p)
    end
  end

  defp prepare_function_body(body) do
    body = cond do
      body == nil ->
        []
      is_list(body) ->
        Enum.map(body, &Translator.translate(&1))
      true ->
        [Translator.translate(body)]
    end

    return_last_expression(body)
  end

  def return_last_expression([]) do
    [Builder.return_statement(Builder.literal(nil))]
  end

  def return_last_expression(%ESTree.BlockStatement{} = block) do
    %ESTree.BlockStatement{ block | body: return_last_expression(block.body) }
  end

  def return_last_expression(list) when is_list(list) do
    last_item = List.last(list)

    last_item = case last_item do
      %ESTree.Literal{} ->
        Builder.return_statement(last_item) 
      %ESTree.Identifier{} ->
        Builder.return_statement(last_item) 
      %ESTree.VariableDeclaration{} ->
        declaration = hd(last_item.declarations).id

        return_statement = case declaration do
          %ESTree.ArrayPattern{} ->
            Builder.return_statement(Builder.array_expression(declaration.elements))
          _ ->
            Builder.return_statement(declaration)  
        end

        [last_item, return_statement]
      %ESTree.BlockStatement{} ->
        last_item = %ESTree.BlockStatement{ last_item | body: return_last_expression(last_item.body) }
      _ ->
        if String.contains?(last_item.type, "Expression") do
          Builder.return_statement(last_item) 
        else
          [last_item, Builder.return_statement(Builder.literal(nil))]
        end    
    end


    list = Enum.take(list, length(list)-1) 
    |> Enum.map(fn(x) ->
      case x do
        %ESTree.MemberExpression{} ->
          Builder.expression_statement(x)
        %ESTree.CallExpression{} ->
          Builder.expression_statement(x)
        _ ->
          x
      end
    end)

    if is_list(last_item) do
      list ++ last_item
    else
      list ++ [last_item]
    end
  end

end