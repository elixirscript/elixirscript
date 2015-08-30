defmodule ElixirScript.Translator.Struct do
  @moduledoc false
  require Logger
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  def make_struct(module_name, data) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(List.last(module_name)),
        JS.identifier(:defstruct)
      ),
      Enum.map(data, fn({k, v})->
        JS.assignment_expression(
          :=,
          JS.identifier(k),
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

  defp do_make_defstruct(name, params, defaults) do
    JS.function_declaration(
      JS.identifier(name),
      Enum.map(params, &JS.identifier(&1)),
      Enum.map(defaults, &Translator.translate(&1)),
      JS.block_statement([
        JS.return_statement(
          JS.object_expression(
            [JS.property(JS.identifier(:__struct__), JS.identifier(:__MODULE__))] ++
            Enum.map(params, fn(x) -> JS.property(JS.identifier(x), JS.identifier(x)) end)
          )
        )
      ])
    )
  end

end