defmodule ElixirScript.ModuleSystems.ES do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def build(body, exports, env) do
    js_module_refs = State.get_javascript_module_references(env.state, env.module)
    std_import = make_std_lib_import(env)
    module_refs = State.get_module_references(env.state, env.module) -- [env.module]
    |> module_imports_to_js_imports(env)

    imports = js_module_refs ++ std_import
    |> Enum.map(fn
      {module, path, true} -> import_module(module, path, env)
      {module, path, false} -> import_namespace_module(module, path, env)
    end)

    imports = Enum.uniq(imports ++ module_refs)

    export = export_module(exports)
    imports ++ body ++ [export]
  end

  defp module_imports_to_js_imports(module_refs, env) do
    Enum.map(module_refs, fn(x) ->
      module_name = Utils.name_to_js_name(x)
      app_name = State.get_module(env.state, x).app
      path = Utils.make_local_file_path(app_name, Utils.name_to_js_file_name(x), env)
      import_module(module_name, path)
    end)
  end

  defp make_std_lib_import(env) do
    compiler_opts = State.get(env.state).compiler_opts
    case compiler_opts.import_standard_libs do
      true ->
        [{:Elixir, Utils.make_local_file_path(:elixir, compiler_opts.core_path, env), true }]
      false ->
        []
    end
  end

  def import_namespace_module(module_name, from, env) do
    import_specifier = JS.import_namespace_specifier(
      Translator.translate!(module_name, env),
      Translator.translate!(module_name, env)
    )

    do_import_module([import_specifier], from)
  end

  def import_module(module_name, from, env) do
    import_specifier = JS.import_default_specifier(
      Translator.translate!(module_name, env),
      Translator.translate!(module_name, env)
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
