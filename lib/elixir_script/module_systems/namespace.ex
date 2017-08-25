defmodule ElixirScript.ModuleSystems.Namespace do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translate.Helpers
  alias ElixirScript.Translate.Identifier

  def build(module_name, body, exports) do
    List.wrap(make_namespace_body(module_name, body, exports))
  end

  defp module_name_function_call(module_name, function) do
    members = ["Elixir"] ++ Module.split(module_name) ++ [function]
    Identifier.make_namespace_members(members)
  end

  defp build_namespace() do
    JS.member_expression(
      JS.identifier("ElixirScript"),
      JS.member_expression(
        JS.identifier(:Core),
        JS.member_expression(
          JS.identifier(:Functions),
          JS.identifier(:build_namespace)
        )
      )
    )
  end

  defp make_namespace_body(module_name, body, exports) do
    values = module_name_function_call(module_name, "__exports")

    js_if = JS.if_statement(
      values,
      JS.return_statement(values)
    )

    exports = if is_nil(exports) do
      JS.object_expression([])
    else
      exports
    end

    declaration = Helpers.declare("__exports", exports)

    assign = JS.assignment_expression(
      :=,
      values,
      JS.identifier("__exports")
    )

    exports = [JS.return_statement(JS.identifier("__exports"))]

    make = JS.member_expression(
          Helpers.call(
            build_namespace(),
            [JS.identifier("Elixir"), JS.literal(Enum.join(["Elixir"] ++ Module.split(module_name), "."))]
          ),
          JS.identifier("__load")
    )

    func_body = JS.block_statement([js_if] ++ body ++ [declaration, assign] ++ exports)

    func = Helpers.function([JS.identifier("Elixir")], func_body)
    JS.assignment_expression(
      :=,
      make,
      func
    )
  end
end
