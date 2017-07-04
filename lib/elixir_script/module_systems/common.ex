defmodule ElixirScript.ModuleSystems.Common do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS

  def build(imports, js_imports, body, exports) do
    module_imports = Enum.map(imports, fn {module, path} -> import_module(module, path) end)

    imports = js_imports
    |> Enum.map(fn
      {module, path} -> import_module(module, path)
    end)

    imports = Enum.uniq(imports ++ module_imports)

    export = if is_nil(exports), do: [], else: [export_module(exports)]
    imports ++ body ++ export
  end

  defp import_module(module_name, from) do
    js_module_name = ElixirScript.Translate.Identifier.make_namespace_members(module_name)
    do_import_module(js_module_name, from)
  end

  defp do_import_module(ref, file_path) do

    ref_declarator = JS.variable_declarator(
      ref,
      JS.call_expression(
        JS.identifier("require"),
        [JS.literal(file_path)]
      )
    )

    JS.variable_declaration([ref_declarator], :const)

  end

  defp export_module(exported_object) do
    JS.assignment_expression(
      :=,
      JS.member_expression(
        JS.identifier("module"),
        JS.identifier("exports")
      ),
      exported_object
    )
  end


end
