defmodule ElixirScript.ModuleSystems.Common do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator

  def build(body, exports, env) do
    js_module_refs = State.get_javascript_module_references(env.state, env.module)
    std_import = make_std_lib_import(env)
    module_refs = State.get_module_references(env.state, env.module) -- [env.module]
    |> module_imports_to_js_imports(env)
    app_name = State.get_module(env.state, env.module).app

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
    do_import_module(Translator.translate!(module_name, env), from)
  end

  def import_module(module_name, from, env) do
    do_import_module(Translator.translate!(module_name, env), from)
  end

  def import_module(import_name, from) do
    do_import_module(JS.identifier(import_name), from)
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

  def export_module(exported_object) do
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
