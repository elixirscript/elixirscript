defmodule ElixirScript.ModuleSystems.Namespace do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.State
  alias ElixirScript.Translator.Utils
  alias ElixirScript.Translator.Identifier

  def build(module_name, imports, body, exports, env) do
    module_imports = imports
    |> Enum.filter(fn 
      {mod, _} -> 
        case Module.split(mod) do
          ["JS"] -> false
          _ -> true
        end
    end)
    |> Enum.map(fn {module, path} ->
      import_module(module)
    end)

    List.wrap(make_namespace_body(module_name, module_imports, body, exports))
  end

  defp module_name_function_call(module_name, function) do
    members = ["Elixir"] ++ Module.split(module_name) ++ [function]
    Identifier.make_namespace_members(members)
  end

  def import_module(module_name) do
    name = ["Elixir" | Module.split(module_name) ] |> Enum.join("$")

    declarator = JS.variable_declarator(
      JS.identifier(name),
      JS.call_expression(
        module_name_function_call(module_name, "__load"),
        [JS.identifier("Elixir")]
      )
    )

    JS.variable_declaration([declarator], :const)
  end

  defp build_namespace() do
    JS.member_expression(
      JS.identifier("Bootstrap"),
      JS.member_expression(
        JS.identifier(:Core),
        JS.member_expression(
          JS.identifier(:Functions),
          JS.identifier(:build_namespace)
        )
      )
    )   
  end

  defp make_namespace_body(module_name, imports, body, exports) do
    values = module_name_function_call(module_name, "__exports")

    _if = JS.if_statement(
      values,
      JS.return_statement(values)
    )

    exports = if is_nil(exports) do
      JS.object_expression([])
    else 
      exports
    end

    declarator = JS.variable_declarator(
      JS.identifier("__exports"),
      exports
    )

    declaration = JS.variable_declaration([declarator], :const)    

    assign = JS.assignment_expression(
      :=,
      values,
      JS.identifier("__exports")
    )

    exports = [JS.return_statement(JS.identifier("__exports"))]  

    make = JS.member_expression(
          JS.call_expression(
            build_namespace(),
            [JS.identifier("Elixir"), JS.literal(Utils.name_to_js_file_name(module_name))]
          ),
          JS.identifier("__load")
    )

    func_body = JS.block_statement([_if] ++ body ++ [declaration, assign] ++ imports ++ exports)

    func = JS.function_expression([JS.identifier("Elixir")], [], func_body)
    JS.assignment_expression(
      :=,
      make,
      func
    )
  end
end