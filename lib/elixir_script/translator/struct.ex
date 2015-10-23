defmodule ElixirScript.Translator.Struct do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Map

  def make_struct(module_name, data, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(List.last(module_name)),
        JS.identifier(:defstruct)
      ),
      [Translator.translate(data, env)]
    )
  end

  def make_defstruct(attributes, env) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    defaults = Enum.map(attributes, fn({x, y}) ->
      Map.make_property(
        Translator.translate(x, env),
        Translator.translate(y, env)
      )
    end)
    |> JS.object_expression

    do_make_defstruct(:defstruct, defaults, env)
  end

  def make_defstruct(attributes, env) do
    defaults = Enum.map(attributes, fn(x) ->
      Map.make_property(
        Translator.translate(x, env),
        Translator.translate(nil, env)
      )
    end)
    |> JS.object_expression

    do_make_defstruct(:defstruct, defaults, env)
  end

  def make_defexception(attributes, env) when length(attributes) == 1 do
    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    defaults = Enum.map(attributes, fn
      ({x, y}) ->
        Map.make_property(
          Translator.translate(x, env),
          Translator.translate(y, env)
        )
      (x) ->
        Map.make_property(
          Translator.translate(x, env),
          Translator.translate(nil, env)
        )
    end)
    |> JS.object_expression

    do_make_defstruct(:defexception, defaults, env)
  end

  def make_defexceptions(attributes, env) do
    defaults = Enum.map(attributes, fn
      (x) ->
        Map.make_property(
          Translator.translate(x, env),
          Translator.translate(nil, env)
        )
    end)
    |> JS.object_expression

    do_make_defstruct(:defexception, defaults, env)
  end

  defp do_make_defstruct(name, defaults, env) do
    struct_name = Map.make_property(Translator.translate(:__struct__, env), JS.identifier(:__MODULE__))

    defaults = %{ defaults | properties: [struct_name]  ++ defaults.properties }

    JS.function_declaration(
      JS.identifier(name),
      [JS.identifier(:values)],
      [JS.object_expression([])],
      JS.block_statement([
        JS.return_statement(
          JS.call_expression(
            JS.member_expression(
              JS.member_expression(
                JS.identifier("Elixir"),
                JS.identifier("Kernel")
              ),
              JS.identifier("defstruct")
            ),
            [defaults, JS.identifier(:values)]
          )
        )
      ])
    )
  end

end