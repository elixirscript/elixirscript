defmodule ExToJS.Translator.Data do
  require Logger
  alias ESTree.Builder
  alias ExToJS.Translator


  def make_object(properties) do
    properties
    |> Enum.map(fn({x, y}) -> 
      Builder.property(Builder.literal(x), Translator.translate(y)) 
    end)
    |> Builder.object_expression
  end

  def make_struct(module_name, data) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier(module_name),
        Builder.identifier(:defstruct)
      ),
      Enum.map(data, fn({k, v})->
        Builder.assignment_expression(
          :=,
          Builder.identifier(k),
          Translator.translate(v)
        )
      end)
    )
  end

  def make_defstruct(attributes) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    params = Enum.map(attributes, fn({x,_y}) -> x end)
    defaults = Enum.map(attributes, fn({_x,y}) -> y end)

    Builder.export_declaration(
      Builder.function_declaration(
        Builder.identifier(:defstruct),
        Enum.map(params, &Builder.identifier(&1)),
        Enum.map(defaults, &Translator.translate(&1)),
        Builder.block_statement([
          Builder.return_statement(
            Builder.object_expression(
              [Builder.property(Builder.identifier(:__struct__), Builder.identifier(:__MODULE__))] ++
              Enum.map(params, fn(x) -> Builder.property(Builder.identifier(x), Builder.identifier(x)) end)
            )
          )
        ])
      )
    )

  end

  def make_defstruct(attributes) do
    params = Enum.map(attributes, fn(x) -> x end)
    defaults = []

    Builder.export_declaration(
      Builder.function_declaration(
        Builder.identifier(:defstruct),
        Enum.map(params, &Builder.identifier(&1)),
        [],
        Builder.block_statement([
          Builder.return_statement(
            Builder.object_expression(
              [Builder.property(Builder.identifier(:__struct__), Builder.identifier(:__MODULE__))] ++
              Enum.map(params, fn(x) -> Builder.property(Builder.identifier(x), Builder.identifier(x)) end)
            )
          )
        ])
      )
    )
  end


  def make_map_update(map, data) do
    _results = Builder.identifier("_results")

    cloning = Builder.call_expression(
      Builder.member_expression(
        Builder.identifier(:JSON),
        Builder.identifier(:parse)
      ),
      [
        Builder.call_expression(
          Builder.member_expression(
            Builder.identifier(:JSON),
            Builder.identifier(:stringify)
          ),
          [
            Translator.translate(map)
          ]
        )      
      ]
    )

    variable_declarator = Builder.variable_declarator(_results, cloning)
    variable_declaration = Builder.variable_declaration([variable_declarator], :let)

    block_statement = Enum.map(data, fn({key, value}) ->
      Builder.expression_statement(
        Builder.assignment_expression(
          :=,
          Builder.member_expression(
            Builder.identifier("_results"),
            Builder.identifier(key)
          ),
          Translator.translate(value)
        )
      )
    end)

    block_statement = [variable_declaration] ++ block_statement ++ [Builder.return_statement(_results)]

    Builder.expression_statement(
      Builder.call_expression(
        Builder.function_expression([], [], Builder.block_statement(block_statement)),
        []
      )
    )
  end

end