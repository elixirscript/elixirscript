defmodule ElixirScript.Translator.JS do
  @moduledoc false

  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  @doc false
  def translate_js_function(name, params, env) do
    do_translate({name, [], params}, env)
  end

  defp do_translate({:new, _, [{:__aliases__, _, module_name}, params]}, env) do
    Builder.new_expression(
      Utils.make_module_expression_tree(module_name, false, env),
      Enum.map(params, &Translator.translate(&1, env))
    )
  end

  defp do_translate({:new, _, [module_name, params]}, env) do
    Builder.new_expression(
      Translator.translate(module_name, env),
      Enum.map(params, &Translator.translate(&1, env))
    )
  end

  defp do_translate({:update, _, [object, property, value]}, env) do
    Builder.assignment_expression(
      :=,
      Builder.member_expression(
        Translator.translate(object, env),
        Translator.translate(property, env),
        true
      ),
      Translator.translate(value, env)
    )
  end

  defp do_translate({:import, _, [module_names, from]}, env) when is_list(module_names) do
    import_specifiers = Enum.map(module_names, fn(x) ->
        Builder.import_specifier(
          Translator.translate(x, env),
          Translator.translate(x, env)
        )
    end)

    build_import_declaration(import_specifiers, from)
  end

  defp do_translate({:import, _, [module_name, from]}, env) do

    import_specifier = Builder.import_specifier(
      Builder.identifier("default"),
      Translator.translate(module_name, env)
    )

    build_import_declaration([import_specifier], from)
  end

  defp build_import_declaration(import_specifiers, from) do
    Builder.import_declaration(
      import_specifiers,
      Builder.identifier("'#{from}'")
    )
  end

end
