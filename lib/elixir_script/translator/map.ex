defmodule ElixirScript.Translator.Map do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def make_get_property(target, property) do
    JS.member_expression(
      Translator.translate(target),
      Translator.translate(property),
      true
    )
  end

  def make_object(properties) do
    properties
    |> Enum.map(fn
      ({x, {:__aliases__, _, [value]}}) -> JS.property(JS.literal(x), JS.identifier(value)) 
      ({x, y}) -> JS.property( JS.literal(x), Translator.translate(y)) 
    end)
    |> JS.object_expression
  end

  def make_map_update(map, data) do
    _results = JS.identifier("_results")
    prop = JS.identifier(:prop)
    _map = Translator.translate(map)

    variable_declarator = JS.variable_declarator(_results, JS.object_expression([]))
    variable_declaration = JS.variable_declaration([variable_declarator], :let)

    assignment = JS.for_in_statement(
      JS.variable_declaration([
        JS.variable_declarator(prop)
      ], :let),
      _map,
      JS.block_statement([
        JS.if_statement(
          JS.call_expression(
            JS.member_expression(
              _map,
              JS.identifier(:hasOwnProperty)
            ),
            [
              prop
            ]
          ),
          JS.block_statement([
            JS.expression_statement(
              JS.assignment_expression(
                :=,
                JS.member_expression(
                  _results,
                  prop,
                  true
                ),
                JS.member_expression(
                  _map,
                  prop,
                  true
                )          
              )
            )

          ])
        )
      ])
    )

    block_statement = Enum.map(data, fn({key, value}) ->
      JS.expression_statement(
        JS.assignment_expression(
          :=,
          JS.member_expression(
            JS.identifier("_results"),
            JS.identifier(key)
          ),
          Translator.translate(value)
        )
      )
    end)

    block_statement = [variable_declaration] ++ [assignment] ++ block_statement ++ [JS.return_statement(_results)]

    Utils.wrap_in_function_closure(block_statement)
  end

end