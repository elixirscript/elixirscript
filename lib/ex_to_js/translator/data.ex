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

  def make_struct(attributes) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    params = Enum.map(attributes, fn({x,_y}) -> x end)
    defaults = Enum.map(attributes, fn({_x,y}) -> y end)

    make_class_body(params, defaults)
  end

  def make_struct(attributes) do
    params = Enum.map(attributes, fn(x) -> x end)
    defaults = []

    make_class_body(params, defaults)
  end


  defp make_class_body(params, defaults) do

    body = Enum.map(params, fn(x) -> 
      Builder.expression_statement(
        Builder.assignment_expression(
          :=,
          Builder.member_expression(
            Builder.this_expression(),
            Builder.identifier(x)
          ),
          Builder.identifier(x)       
        )
      )
    end)

    Builder.class_body([
      Builder.method_definition(
        Builder.identifier("constructor"),
        Builder.function_expression(
          Enum.map(params, fn(x) -> Builder.identifier(x) end),
          Enum.map(defaults, fn(x) -> Builder.literal(x) end),
          Builder.block_statement(body)
        )
      )]
    )
  end

end