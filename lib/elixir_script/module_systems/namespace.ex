defmodule ElixirScript.ModuleSystems.Namespace do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils

  def build(module_name, imports, body, exports, env) do
    module_imports = Enum.map(imports, fn {module, path} -> import_module(module, env) end)
    export = export_module(exports)
    List.wrap(make_namespace_body(module_name, imports, body, export))
  end

  defp module_imports_to_js_imports(module_refs, env) do
    Enum.map(module_refs, fn(x) ->
      module_name = Utils.name_to_js_name(x)
      app_name = State.get_module(env.state, x).app
      path = Utils.make_local_file_path(app_name, Utils.name_to_js_file_name(x), env)
      import_module(module_name, path)
    end)
  end

  def import_module(module_name, env) do
    declarator = JS.variable_declarator(
      Translator.translate!(module_name, env),
      JS.call_expression(
        JS.member_expression(
          JS.call_expression(
                    JS.member_expression(
                      JS.identifier(:Elixir),
                      JS.member_expression(
                        JS.identifier(:Core),
                        JS.member_expression(
                          JS.identifier(:Functions),
                          JS.identifier(:build_namespace)
                        )
                      )
                    ),
                    [JS.identifier("Elixir"), Utils.name_to_js_file_name(module_name)]
                  ),
         JS.identifier("make")
        ),
        []
      )
    )

    JS.variable_declaration([declarator], :const)
  end

  def export_module(exported_object) do
    exported_object
  end

  def make_namespace_body(module_name, imports, body, exports) do
    exports = if is_nil(exports), do: [], else: [JS.return_statement(exports)]

    make = JS.member_expression(
          JS.call_expression(
                    JS.member_expression(
                      JS.identifier(:Elixir),
                      JS.member_expression(
                        JS.identifier(:Core),
                        JS.member_expression(
                          JS.identifier(:Functions),
                          JS.identifier(:build_namespace)
                        )
                      )
                    ),
                    [JS.identifier("Elixir"), Utils.name_to_js_file_name(module_name)]
                  ),
                  JS.identifier("make")
    )

    func = JS.function_expression([JS.identifier("Elixir")], [], JS.block_statement(imports ++ body ++ exports))
    JS.assignment_expression(
      :=,
      make,
      func
    )
  end
end