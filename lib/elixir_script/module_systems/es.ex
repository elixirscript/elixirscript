defmodule ElixirScript.ModuleSystems.ES do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS

  def build(js_imports, body, exports) do
    imports = js_imports
    |> Enum.map(fn
      {_module, name, _path, import_path} -> import_module(name, import_path)
    end)

    export = if is_nil(exports), do: [], else: [export_module(exports)]
    imports ++ body ++ export
  end

  defp import_module(import_name, from) do
    js_module_name = JS.identifier(import_name)

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
