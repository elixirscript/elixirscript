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
    exception_key_value = Map.make_property(Translator.translate(:__exception__, env), Translator.translate(true, env))

    attributes = Enum.flat_map(attributes, fn(x) -> x end)

    defaults = [exception_key_value] ++ Enum.map(attributes, fn
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
    exception_key_value = Map.make_property(Translator.translate(:__exception__, env), Translator.translate(true, env))

    defaults = [exception_key_value] ++ Enum.map(attributes, fn
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

    ref = JS.identifier(name)

    ref_declarator = JS.variable_declarator(
      ref,
      JS.call_expression(
        JS.member_expression(
          JS.member_expression(
            JS.identifier("Elixir"),
            JS.identifier("Kernel")
          ),
          JS.identifier(name)
        ),
        [defaults]
      )
    )

    JS.variable_declaration([ref_declarator], :const)
  end

end
