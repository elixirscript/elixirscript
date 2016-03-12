defmodule ElixirScript.Translator.Protocol do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Module
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils

  @doc """
  Takes a protocol and turns them into modules
  """
  def make(name, functions, env) do
    { body, _ } = Module.translate_body( {:__block__, [], [] }, env)

    module_refs = ElixirScript.Translator.State.get_module_references(name)

    {imports, body} = Module.extract_imports_from_body(body)

    imports = imports ++ Module.make_std_lib_import() ++ Module.make_imports(module_refs) ++ [ElixirScript.ModuleSystems.import_module("Implementation", Utils.make_local_file_path(Utils.name_to_js_file_name(name) <> ".defimpl"))]

    object = process_spec_functions(functions)
    |> Enum.map(fn({key, value}) ->
      Map.make_property(JS.identifier(Utils.filter_name(key)), value)
    end)
    |> JS.object_expression

    declarator = JS.variable_declarator(
      JS.identifier(Utils.name_to_js_name(name)),
      JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Core),
            JS.member_expression(
              JS.identifier(:Functions),
              JS.identifier(:defprotocol)
            )
          )
        ),
        [object]
      )
    )

    declaration = JS.variable_declaration([declarator], :const)

    implementations = JS.for_of_statement(
      JS.object_pattern([
          JS.assignment_property(JS.identifier("Type")),
          JS.assignment_property(JS.identifier("Implementation"))
      ]),
      JS.identifier("Implementations"),
      JS.call_expression(
        JS.member_expression(
          JS.identifier(:Elixir),
          JS.member_expression(
            JS.identifier(:Core),
            JS.member_expression(
              JS.identifier(:Functions),
              JS.identifier(:defimpl)
            )
          )
        ),
        [
          JS.identifier(Utils.name_to_js_name(name)),
          JS.identifier("Type"),
          JS.identifier("Implementation")
        ]
      )
    )

    default = JS.export_default_declaration(JS.identifier(Utils.name_to_js_name(name)))

    IO.inspect(imports)

    %{
      name: name,
      body: imports ++ body ++ [declaration] ++ [implementations] ++ [default]
    }
  end

  defp process_spec_functions(functions) do
    Enum.map(Keyword.keys(functions), fn(function_name) ->
      {function_name, JS.function_expression([], [], JS.block_statement([]))}
    end)
  end

  def make_defimpl(name) do
    imports = Module.make_std_lib_import()

    declarator = JS.variable_declarator(
      JS.identifier("impls"),
      JS.array_expression([])
    )

    declaration = JS.variable_declaration([declarator], :let)

    default = JS.export_default_declaration(JS.identifier("impls"))

    "Elixir." <> protocol_name = Atom.to_string(name)

    %{
      name: String.to_atom(protocol_name <> ".defimpl"),
      body: imports ++ declaration ++ [default]
    }
  end
end
