defmodule ElixirScript.Lib.DOM do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  def translate_dom_function(name, params, env) do
    do_translate({name, [], params}, env)
  end

  defp do_translate({name, _, params}, env) when name in [:create, :diff, :patch] do
    call_virtual_dom(name, params, env)
  end

  defp do_translate({element, _, [[do: {:__block__, [], params}]] }, env) do
    call_virtual_dom(:h, [Atom.to_string(element), {:%{}, [], []}, params], env)
  end

  defp do_translate({element, _, [[do: param]] }, env) do
    call_virtual_dom(:h, [Atom.to_string(element), {:%{}, [], []}, [param] ], env)
  end

  defp do_translate({element, _, [config]}, env) do
    call_virtual_dom(:h, [Atom.to_string(element), config_to_map(config)], env)
  end

  defp do_translate({element, _, [config , [do: {:__block__, [], params}] ]}, env) do
    call_virtual_dom(:h, [Atom.to_string(element), config_to_map(config), params], env)
  end

  defp do_translate({element, _, [config , [do: param] ]}, env) do
    call_virtual_dom(:h, [Atom.to_string(element), config_to_map(config), [param]], env)
  end

  defp call_virtual_dom(function, params, env) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier(:virtualDom),
        JS.identifier(function)
      ),
      Enum.map(params, &Translator.translate(&1, env))
    )
  end

  defp config_to_map(config) do
    {:%{}, [], config}
  end

end