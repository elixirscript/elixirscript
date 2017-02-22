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
      {module, path, true} -> import_module(module, path)
      {module, path, false} -> import_namespace_module(module, path)
    end)

    imports = Enum.uniq(imports ++ module_imports)

    export = if is_nil(exports), do: [], else: [export_module(exports)]
    imports ++ body ++ export
  end

  def import_namespace_module(module_name, from) do
    import_specifier = JS.import_namespace_specifier(
      JS.identifier(module_name),
      JS.identifier(module_name)
    )

    do_import_module([import_specifier], from)
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
