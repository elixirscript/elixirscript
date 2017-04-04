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
        Builder.identifier("Core")
      ),
      Builder.identifier("global")
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

  def translate_js_module(module, env) do
    { do_translate(module, env), env }
  end

  defp do_translate({:__aliases__, _, module}, env) do
    Identifier.make_namespace_members(module)
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
      JS.Object.assign(unquote(object), unquote(map))
    end

    Translator.translate!(quoted, env)
  end

  defp do_translate({:update, _, [object, key, value]}, env) do
    Builder.assignment_expression(
      :=,
      Builder.member_expression(
        Translator.translate!(object, env),
        Translator.translate!(key, env),
        true
      ),
      Translator.translate!(value, env)
    )
  end

  defp do_translate({:import, _, [term]}, env) do
    Builder.call_expression(
      Builder.identifier("import"),
      [Translator.translate!(term, env)]
    )
  end

  defp do_translate({:debugger, _, _}, env) do
    Builder.debugger_statement()
  end

  defp do_translate({:this, _, _}, env) do
    Builder.this_expression()
  end

  defp do_translate({:__delete__, _, [expr]}, env) do
    {result, _} = ElixirScript.Translator.Expression.make_unary_expression(:delete, expr, env)
    result
  end

  defp do_translate({:__bnot__, _, [expr]}, env) do
    {result, _} = ElixirScript.Translator.Expression.make_unary_expression(:"~", expr, env)
    result
  end

  defp do_translate({:__band__, _, [left, right]}, env) do
    {result, _} = ElixirScript.Translator.Expression.make_binary_expression(:&, left, right, env)
    result
  end

  defp do_translate({:__bor__, _, [left, right]}, env) do
    {result, _} = ElixirScript.Translator.Expression.make_binary_expression(:|, left, right, env)
    result
  end

  defp do_translate({:__bsl__, _, [left, right]}, env) do
    {result, _} = ElixirScript.Translator.Expression.make_binary_expression(:"<<", left, right, env)
    result
  end

  defp do_translate({:__bsr__, _, [left, right]}, env) do
    {result, _} = ElixirScript.Translator.Expression.make_binary_expression(:">>", left, right, env)
    result
  end

  defp do_translate({:__bxor__, _, [left, right]}, env) do
    {result, _} = ElixirScript.Translator.Expression.make_binary_expression(:^, left, right, env)
    result
  end

  defp do_translate({function, _, []}, env) do
    Builder.call_expression(
      call_property(),
      [
        global(),
        Translator.translate!(to_string(function), env)
      ]
    )
  end

  defp do_translate({function, _, params}, env) do
    Builder.call_expression(
      Builder.member_expression(
        global(),
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
          global(),
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
          global(),
          members
        ),
        Builder.identifier(function)
      ),
      Enum.map(params, &Translator.translate!(&1, env))
    )
  end

end
