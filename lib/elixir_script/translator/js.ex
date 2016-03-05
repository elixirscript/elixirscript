defmodule ElixirScript.Translator.JS do
  @moduledoc false

  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.ModuleSystems.ES6

  @doc false
  def translate_js_function(name, params, env) do
    { do_translate({name, [], params}, env), env }
  end

  defp do_translate({:typeof, _, [param]}, env) do
    Builder.unary_expression(
      :typeof,
      true,
      Translator.translate!(param, env)
    )
  end


  defp do_translate({:instanceof, _, [value, type]}, env) do
    Builder.binary_expression(
      :instanceof,
      Translator.translate!(value, env),
      Translator.translate!(type, env)
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
    ES6.import_module(module_names, from, env)
  end

  defp do_translate({:import, _, [module_name, from]}, env) do
    ES6.import_module(module_name, from, env)
  end

  defp do_translate({:import, _, [module_name]}, env) do
    ES6.import_module(module_name, env)
  end

end
