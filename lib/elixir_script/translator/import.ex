defmodule ElixirScript.Translator.Import do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS

  def make_import(module_name) do
    import_specifier = JS.import_namespace_specifier(
      JS.identifier(ElixirScript.Module.name_to_js_name(module_name))
    )

    JS.import_declaration(
      [import_specifier],
      JS.literal("#{ElixirScript.Module.name_to_js_file_name(module_name)}")
    )
  end

  def create_standard_lib_imports(root, name) do

    import_specifier = JS.import_namespace_specifier(
      JS.identifier(:Elixir)
    )

    import_declaration = JS.import_declaration(
      [import_specifier],
      JS.identifier("'#{make_root(root) <> name}'")
    )

    [import_declaration]
  end

  defp make_root(nil) do
    ""
  end

  defp make_root(root) do
    root <> "/"
  end

end
