defmodule ElixirScript.ModuleSystems.Common do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def build(std_import, imports, js_imports, body, exports, env) do
    module_imports = Enum.map(imports, fn {module, path} -> import_module(module, path) end)

    imports = js_imports ++ List.wrap(std_import)
    |> Enum.map(fn
      {module, path} -> import_module(module, path, env)      
      {module, path, true} -> import_module(module, path, env)
      {module, path, false} -> import_namespace_module(module, path, env)
    end)

    imports = Enum.uniq(imports ++ module_imports)

    export = if is_nil(exports), do: [], else: [export_module(exports)]
    imports ++ body ++ export
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

  def import_module(:Elixir, from, env) do
    do_import_module(JS.identifier("Elixir"), from)
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
