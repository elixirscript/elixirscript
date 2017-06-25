defmodule ElixirScript.ModuleSystems.ES do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def build(imports, js_imports, body, exports) do
    module_imports = Enum.map(imports, fn {module, path} -> import_module(module, path) end)

    imports = js_imports
    |> Enum.map(fn
      {module, path} -> import_module(module, path)
      {module, path, default: true} -> import_module(module, path)
      {module, path, default: false} -> import_namespace_module(module, path)
    end)

    imports = Enum.uniq(imports ++ module_imports)

    export = if is_nil(exports), do: [], else: [export_module(exports)]
    imports ++ body ++ export
  end

  defp import_namespace_module(module_name, from) do
    js_module_name = ElixirScript.Translate.Identifier.make_namespace_members(module_name)

    import_specifier = JS.import_namespace_specifier(
      js_module_name,
      js_module_name
    )

    do_import_module([import_specifier], from)
  end

  defp import_module(import_name, from) do
    js_module_name = ElixirScript.Translate.Identifier.make_namespace_members(import_name)

    import_specifier = JS.import_default_specifier(
      js_module_name
    )

    do_import_module([import_specifier], from)
  end

  defp do_import_module(import_specifiers, file_path) do
    JS.import_declaration(
      import_specifiers,
      JS.literal(file_path)
    )
  end

  defp export_module(exported_object) do
    JS.export_default_declaration(exported_object)
  end

end
