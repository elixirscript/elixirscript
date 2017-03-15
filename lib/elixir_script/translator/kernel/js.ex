defmodule ElixirScript.Translator.JS do
  @moduledoc false

  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Identifier

  def call_property() do
    Builder.member_expression(
      Builder.member_expression(
        Builder.identifier("Bootstrap"),
        Builder.member_expression(
          Builder.identifier("Core"),
          Builder.identifier("Functions")
        )
      ),
      Builder.identifier("call_property")
    )
  end

  def global() do
    Builder.member_expression(
      Builder.member_expression(
        Builder.identifier("Bootstrap"),
        Builder.member_expression(
          Builder.identifier("Core"),
          Builder.identifier("Functions")
        )
      ),
      Builder.identifier("get_global")
    )
  end

  @doc false
  def translate_js_function({:__aliases__, _, module}, name, params, env) do
    { do_translate(module, {name, [], params}, env), env }
  end

  @doc false
  def translate_js_function(name, params, env) do
    { do_translate({name, [], params}, env), env }
  end

  defp do_translate({op, _, [param]}, env) when op in [:typeof, :delete, :void, :-, :+, :!, :"~"] do
    Builder.unary_expression(
      op,
      true,
      Translator.translate!(param, env)
    )
  end

  defp do_translate({op, _, [value, type]}, env) when op in [:"**", :==, :!=, :===, :!==, :<, :<=, :>, :>=, :"<<", :">>", :<<<, :+, :-, :*, :/, :%, :|, :^, :&, :in, :instanceof] do
    Builder.binary_expression(
      op,
      Translator.translate!(value, env),
      Translator.translate!(type, env)
    )
  end

  defp do_translate({op, _, [value, type]}, env) when op in [:||, :&&] do
    Builder.logical_expression(
      op,
      Translator.translate!(value, env),
      Translator.translate!(type, env)
    )
  end

  defp do_translate({:yield, _, []}, _) do
    Builder.yield_expression()
  end

  defp do_translate({:yield, _, [term]}, env) do
    Builder.yield_expression(
      Translator.translate!(term, env)
    )
  end

  defp do_translate({:yield_to, _, [term]}, env) do
    Builder.yield_expression(
      Translator.translate!(term, env),
      true
    )
  end

  defp do_translate({:throw, _, [term]}, env) do
    Builder.throw_statement(
      Translator.translate!(term, env)
    )
  end

  defp do_translate({:new, _, [module_name, params]}, env) when not is_list(params) do
    Builder.new_expression(
      Translator.translate!(module_name, env),
      [Builder.rest_element(Translator.translate!(params, env))]
    )
  end

  defp do_translate({:new, _, [module_name, params]}, env) do
    Builder.new_expression(
      Translator.translate!(module_name, env),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

  defp do_translate({:update, _, [object, map]}, env) do
    quoted = quote do
      Object.assign(unquote(object), unquote(map))
    end

    Translator.translate!(quoted, env)
  end

  defp do_translate({:object, _, [args]}, env) do
    args = Enum.map(args, fn
      { k, v } when Kernel.is_atom(k) ->
        { Atom.to_string(k), v }
      pair ->
        pair
    end)

    Translator.translate!({ :%{}, [], args }, env)
  end

  defp do_translate({function, _, []}, env) do
    Builder.call_expression(
      call_property(),
      [
        Builder.call_expression(global(), []),
        Translator.translate!(to_string(function), env)
      ]
    )
  end

  defp do_translate({function, _, params}, env) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.call_expression(global(), []),
        Builder.identifier(function)
      ),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

  defp do_translate(module, {function, _, []}, env) do
    members = Identifier.make_namespace_members(module)

    Builder.call_expression(
      call_property(),
      [
        Builder.member_expression(
          Builder.call_expression(global(), []),
          members
        ),
        Translator.translate!(to_string(function), env)
      ]
    )
  end

  defp do_translate(module, {function, _, params}, env) do
    members = Identifier.make_namespace_members(module)

    Builder.call_expression(
      Builder.member_expression(
        Builder.member_expression(
          Builder.call_expression(global(), []),
          members
        ),
        Builder.identifier(function)
      ),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

end
