defmodule ElixirScript.Translator.JS do
  @moduledoc false

  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Identifier
  alias ElixirScript.ModuleSystems

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

  defp do_translate({:function, _, [{name, _, params}, [do: body]]}, env) when is_list(params) do
    make_function(name, params, body, env, [])
  end

  defp do_translate({:function, _, params}, env) do
    [do: body] = List.last(params)
    params = Enum.reverse(params) |> tl |> Enum.reverse

    make_function(nil, params, body, env, [])
  end

  defp do_translate({:generator, _, [{name, _, params}, [do: body]]}, env) when is_list(params) do
    make_function(name, params, body, env, generator: true)
  end

  defp do_translate({:generator, _, params}, env) do
    [do: body] = List.last(params)
    params = Enum.reverse(params) |> tl |> Enum.reverse

    make_function(nil, params, body, env, generator: true)
  end

  defp do_translate({:async, _, [{name, _, params}, [do: body]]}, env) when is_list(params) do
    make_function(name, params, body, env, async: true)
  end

  defp do_translate({:async, _, params}, env) do
    [do: body] = List.last(params)
    params = Enum.reverse(params) |> tl |> Enum.reverse

    make_function(nil, params, body, env, async: true)
  end

  defp make_function(nil, params, body, env, opts) do
    env = ElixirScript.Translator.LexicalScope.function_scope(env, {nil, length(params)})
    {block, env} = ElixirScript.Translator.Function.prepare_function_body(body, env)

    Builder.function_expression(
      Enum.map(params, &Translator.translate!(&1, env)),
      [],
      Builder.block_statement(block),
      opts[:generator] || false,
      false,
      opts[:async] || false
    )
  end

  defp make_function(name, params, body, env, opts) do
    env = ElixirScript.Translator.LexicalScope.function_scope(env, {name, length(params)})
    {block, env} = ElixirScript.Translator.Function.prepare_function_body(body, env)

    Builder.function_declaration(
      Identifier.make_identifier(name),
      Enum.map(params, &Translator.translate!(&1, env)),
      [],
      Builder.block_statement(block),
      opts[:generator] || false,
      false,
      opts[:async] || false
    )
  end

  defp do_translate({:yield, _, []}, env) do
    Builder.yield_expression()
  end

  defp do_translate({:yield, _, [term]}, env) do
    Builder.yield_expression(
      Translator.translate!(term, env)
    )
  end

  defp do_translate({:await, _, [term]}, env) do
    Builder.await_expression(
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
      Object.assign(unquote(object), unquote(map))
    end

    Translator.translate!(quoted, env)
  end

  defp do_translate({:import, _, [module_names, from]}, env) when is_list(module_names) do
    ModuleSystems.import_module(module_names, from, env)
  end

  defp do_translate({:import, _, [module_name, from]}, env) do
    ModuleSystems.import_module(module_name, from, env)
  end

  defp do_translate({:import, _, [module_name]}, env) do
    ModuleSystems.import_module(module_name, env)
  end

end
