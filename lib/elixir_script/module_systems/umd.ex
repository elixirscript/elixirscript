defmodule ElixirScript.ModuleSystems.UMD do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS

  def build(imports, js_imports, body, exports) do
    module_imports = Enum.map(imports, fn
      {module, path} -> import_module(module, path)
    end)

    imports = js_imports
    |> Enum.map(fn
      {module, path} -> import_module(module, path)
    end)

    imports = Enum.uniq(imports ++ module_imports)

    export = export_module(exports)
    List.wrap(make_umd(imports, body, export))
  end

  defp import_module(module_name, from) do
    js_module_name = ElixirScript.Translate.Identifier.make_namespace_members(module_name)
    {js_module_name, JS.literal(from)}
  end

  defp export_module(exported_object) do
    exported_object
  end

  defp make_umd(imports, body, exports) do
    import_paths = Enum.map(imports, fn({_, path}) -> path end)
    import_identifiers = Enum.map(imports, fn({id, _}) -> id end)
    exports = if is_nil(exports), do: [], else: [JS.return_statement(exports)]

    JS.expression_statement(
      JS.call_expression(
         JS.function_expression([JS.identifier("root"), JS.identifier("factory")], [], JS.block_statement([
          JS.if_statement(
            JS.logical_expression(
              :&&,
              JS.binary_expression(
                :===,
                JS.unary_expression(:typeof, true, JS.identifier("define")),
                JS.literal("function")
              ),
              JS.member_expression(
                JS.identifier("define"),
                JS.identifier("amd")
              )
            ),
            JS.block_statement([
              JS.call_expression(
                JS.identifier("define"),
                [JS.array_expression(import_paths), JS.identifier("factory")]
              )
            ]),
            JS.if_statement(
              JS.binary_expression(
                :===,
                JS.unary_expression(:typeof, true, JS.identifier("exports")),
                JS.literal("object")
              ),
              JS.block_statement([
                JS.assignment_expression(
                  :=,
                  JS.member_expression(
                    JS.identifier("module"),
                    JS.identifier("exports")
                  ),
                  JS.call_expression(
                    JS.identifier("factory"),
                    Enum.map(import_paths, fn x ->
                      JS.call_expression(
                        JS.identifier("require"),
                        [x]
                      )
                    end)
                  )
                )
              ]),
              JS.block_statement([
                JS.assignment_expression(
                  :=,
                  JS.member_expression(
                    JS.identifier("root"),
                    JS.identifier("Elixir")
                  ),
                  JS.call_expression(
                    JS.identifier("factory"),
                    Enum.map(import_identifiers, fn x ->
                      JS.member_expression(
                        JS.identifier("root"),
                        x
                      )
                    end)
                  )
                )
              ])
            )
          )
        ])),
        [JS.this_expression(), JS.function_expression(import_identifiers, [], JS.block_statement(body ++ exports))]
      )
    )
  end
end