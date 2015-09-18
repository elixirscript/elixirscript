defmodule ElixirScript.Translator.Struct do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  def make_struct(module_name, data, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(List.last(module_name)),
        JS.identifier(:defstruct)
      ),
      Enum.map(data, fn({k, v})->
        JS.assignment_expression(
          :=,
          JS.identifier(k),
          Translator.translate(v, env)
        )
      end)
    )
  end

  def make_defstruct(attributes, env) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    params = Enum.map(attributes, fn({x,_y}) -> x end)
    defaults = Enum.map(attributes, fn({_x,y}) -> y end)

    do_make_defstruct(:defstruct, params, defaults, env)
  end

  def make_defstruct(attributes, env) do
    params = Enum.map(attributes, fn(x) -> x end)
    defaults = []

    do_make_defstruct(:defstruct, params, defaults, env)
  end

  def make_defexception(attributes, env) when length(attributes) == 1 do
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

    do_make_defstruct(:defexception, params, defaults, env)
  end

  def make_defexceptions(attributes, env) do
    params = Enum.map(attributes, fn(x) -> x end)
    defaults = []

    do_make_defstruct(:defexception, params, defaults, env)
  end

  defp do_make_defstruct(name, params, defaults, env) do
    JS.function_declaration(
      JS.identifier(name),
      Enum.map(params, &JS.identifier(&1)),
      Enum.map(defaults, &Translator.translate(&1, env)),
      JS.block_statement([
        JS.return_statement(
          ElixirScript.Translator.Map.make_map(
            JS.object_expression(
              [JS.property(Translator.translate(:__struct__, env), JS.identifier(:__MODULE__), :init, false, false, true)] ++
              Enum.map(params, fn(x) -> JS.property(Translator.translate(x, env), JS.identifier(x), :init, false, false, true) end)
            )
          )
        )
      ])
    )
  end

end
