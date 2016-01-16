defmodule ElixirScript.Translator.Import do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Utils

  def make_import(module_name) do
    do_make_import(Utils.name_to_js_name(module_name), Utils.name_to_js_file_name(module_name))
  end

  def create_standard_lib_imports(std_lib_path) do
    do_make_import(:Elixir, std_lib_path)
  end

  defp do_make_import(import_name, file_name) do
    root = ElixirScript.Translator.State.get().compiler_opts.root

    import_specifier = JS.import_default_specifier(
      JS.identifier(import_name)
    )

    root = case root do
      nil ->
        "./"
      root ->
        root <> "/"
    end

    JS.import_declaration(
      [import_specifier],
      JS.literal("#{root <> file_name}")
    )
  end

end
