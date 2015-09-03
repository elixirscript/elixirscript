defmodule ElixirScript.Lib.JS do
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def translate_js_function(name, params, env) do
    do_translate({name, [], params}, env)
  end

  defp do_translate({:new, _, [{:__aliases__, _, module_name}, params]}, env) do
    Builder.new_expression(
      Utils.make_module_expression_tree(module_name, false),
      Enum.map(params, &Translator.translate(&1, env))
    )
  end

end