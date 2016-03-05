defmodule ElixirScript.ModuleSystems.ES6 do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def import_module(module_names, from, env) when is_list(module_names) do
    import_specifiers = Enum.map(module_names, fn(x) ->
      JS.import_specifier(
        Translator.translate!(x, env),
        Translator.translate!(x, env)
      )
    end)

    do_import_module(import_specifiers, from)
  end

  def import_module(module_name, from, env) do
    import_specifier = JS.import_default_specifier(
      Translator.translate!(module_name, env),
      Translator.translate!(module_name, env)
    )

    do_import_module([import_specifier], from)
  end

  def import_module(module_name, %ElixirScript.Macro.Env{} = env) do
    import_specifier = JS.import_default_specifier(
      Translator.translate!(module_name, env),
      Translator.translate!(module_name, env)
    )

    {from, _ } = Code.eval_quoted(module_name)

    do_import_module([import_specifier], Macro.underscore(from))
  end

  def import_module(import_name, from) do
    import_specifier = JS.import_default_specifier(
      JS.identifier(import_name)
    )

    do_import_module([import_specifier], from)
  end

  defp do_import_module(import_specifiers, file_path) do
    JS.import_declaration(
      import_specifiers,
      JS.literal(file_path)
    )
  end

  def export_module(exported_object) do
    JS.export_default_declaration(exported_object)
  end

end
