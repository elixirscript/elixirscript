defmodule ElixirScript.Translator.Data do
  require Logger
  alias ESTree.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def make_get_property(target, property) do
    Builder.member_expression(
      Translator.translate(target),
      Translator.translate(property),
      true
    )
  end


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

    do_make_defstruct(:defstruct, params, defaults)
  end

  def make_defstruct(attributes) do
    params = Enum.map(attributes, fn(x) -> x end)
    defaults = []

    do_make_defstruct(:defstruct, params, defaults)
  end

  def make_defexception(attributes) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    params = Enum.map(attributes, fn(x) ->

      case x do
        a when is_tuple(a) ->
          elem(a, 0)
        _ ->
          x
      end

     end)

    defaults = Enum.map(attributes, fn(x) ->

      case x do
        a when is_tuple(a) ->
          elem(a, 1)
        _ ->
          nil
      end

     end)

    do_make_defstruct(:defexception, params, defaults)
  end

  def make_defexceptions(attributes) do
    params = Enum.map(attributes, fn(x) -> x end)
    defaults = []

    do_make_defstruct(:defexception, params, defaults)
  end

  def throw_error(module_name, data) do
    Builder.throw_statement(
      Builder.new_expression(
        Builder.identifier(module_name),
        [
          Builder.call_expression(
            Builder.member_expression(
              Builder.identifier(module_name),
              Builder.identifier(:defexception)
            ),
            Enum.map(data, fn({k, v})->
              Builder.assignment_expression(
                :=,
                Builder.identifier(k),
                Translator.translate(v)
              )
            end)
          )
        ]
      )
    )
  end

  def throw_error(message) do
    Builder.throw_statement(
      Builder.new_expression(
        Builder.identifier("RuntimeError"),
        [
          Builder.object_expression(
            [
              Builder.property(Builder.identifier(:__struct__), Translator.translate(:RuntimeError)),
              Builder.property(Builder.identifier("message"), Builder.literal(message))
            ]
          )
        ]

      )
    )
  end

  defp do_make_defstruct(name, params, defaults) do
    Builder.export_declaration(
      Builder.function_declaration(
        Builder.identifier(name),
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

    Utils.wrap_in_function_closure(block_statement)
  end

end