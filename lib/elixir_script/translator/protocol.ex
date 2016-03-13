defmodule ElixirScript.Translator.Protocol do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator.Module
  alias ElixirScript.Translator.Map
  alias ElixirScript.Translator.Function
  alias ElixirScript.Translator.Utils
  alias ElixirScript.ModuleSystems

  @doc """
  Takes a protocol and turns it into a module
  """
  def make(name, functions, env) do
    { body, _ } = Module.translate_body( {:__block__, [], [] }, env)

    module_refs = ElixirScript.Translator.State.get_module_references(name)

    {imports, body} = Module.extract_imports_from_body(body)

    imports = imports ++ Module.make_std_lib_import() ++
      Module.make_imports(module_refs) ++
      [ElixirScript.ModuleSystems.import_module("Implementations", Utils.make_local_file_path(Utils.name_to_js_file_name(name) <> ".Defimpl"))]

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
      JS.variable_declaration([JS.variable_declarator(
                                  JS.object_pattern([
                                    JS.assignment_property(JS.identifier("Type")),
                                    JS.assignment_property(JS.identifier("Implementation"))
                                  ]),
                                  nil
      )], :let),
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

  @doc """
  Makes the protocol implementation module for the given implementation name.
  This is used to consolidate all of the protocol implementations.
  """
  def make_defimpl(name, implementations \\ []) do
    imports = Module.make_std_lib_import()

    declarator = JS.variable_declarator(
      JS.identifier("impls"),
      JS.array_expression([])
    )

    declaration = JS.variable_declaration([declarator], :let)

    default = JS.export_default_declaration(JS.identifier("impls"))

    body = Enum.flat_map(implementations, fn(x) ->
      name = Utils.name_to_js_name(x)
      imports = ModuleSystems.import_module(name, Utils.make_local_file_path(Utils.name_to_js_file_name(x)))
      call = JS.call_expression(
        JS.member_expression(
          JS.identifier("impls"),
          JS.identifier("push")
        ),
        [JS.identifier(name)]
      )

      [imports, call]
    end)

    protocol_name = Atom.to_string(name)

    %{
      name: String.to_atom(protocol_name <> ".DefImpl"),
      body: imports ++ [declaration] ++ body ++ [default]
    }
  end
end
