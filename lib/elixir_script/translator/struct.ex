defmodule ElixirScript.Translator.Struct do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Map

  def get_struct_class(module_name, env) do
    current_module = ElixirScript.State.get_module(env.module)

    name = ElixirScript.Module.quoted_to_name(module_name)
    the_alias = ElixirScript.Module.get_alias(current_module, name)

    if the_alias do
      { _, name } = the_alias
    end

    if the_alias == nil && ElixirScript.State.get_module(ElixirScript.Module.quoted_to_name(module_name)) == nil do
      Utils.make_module_expression_tree(module_name, false, env)
    else
      JS.member_expression(
        JS.identifier(ElixirScript.Module.name_to_js_name(name)),
        JS.identifier(ElixirScript.Module.name_to_js_name(name))
      )
    end

  end

  def new_struct(module_name, data, env) do
    JS.call_expression(
      JS.member_expression(
        get_struct_class(module_name, env),
        JS.identifier(:create)
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
    struct_name = Map.make_property(Translator.translate(:__struct__, env), Translator.translate({:__MODULE__, [], []}, env))

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
