defmodule ElixirScript.Output.JSModule do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J

  def compile(body, opts) do
    declarator = J.variable_declarator(
      J.identifier("Elixir"),
      J.object_expression([])
    )

    elixir = J.variable_declaration([declarator], :const)

    table_additions = Enum.map(opts.js_modules, fn
      {module, _} -> add_import_to_table(module)
      {module, _, _} -> add_import_to_table(module)
    end)

    ast = opts.module_formatter.build(
      [],
      opts.js_modules,
      [elixir, create_atom_table(), start(), load()] ++ table_additions ++ body,
      J.identifier("Elixir")
    )

    ast
  end

  def start do
    normal = J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [J.literal("normal")]
    )

    J.assignment_expression(
      :=,
      J.member_expression(
        J.identifier("Elixir"),
        J.identifier("start")
      ),
      J.function_expression(
        [J.identifier(:app), J.identifier(:args)],
        [],
        J.block_statement([
          J.call_expression(
            J.member_expression(
              J.call_expression(
                J.member_expression(
                  J.identifier(:app),
                  J.identifier("__load")
                ),
                [J.identifier("Elixir")]
              ),
              J.identifier("start")
            ),
            [normal, J.identifier(:args)]
          )
        ])
      )
    )
  end

  def load do
    J.assignment_expression(
      :=,
      J.member_expression(
        J.identifier("Elixir"),
        J.identifier("load")
      ),
      J.function_expression(
        [J.identifier(:module)],
        [],
        J.block_statement([
          J.return_statement(
            J.call_expression(
              J.member_expression(
                J.identifier(:module),
                J.identifier("__load")
              ),
              [J.identifier("Elixir")]
            )
          )
        ])
      )
    )
  end

  defp create_atom_table() do
    J.assignment_expression(
      :=,
      J.member_expression(
        J.identifier("Elixir"),
        J.identifier("__table__")
      ),
      J.object_expression([])
    )
  end

  defp add_import_to_table(module_name) do
    ref = ElixirScript.Translate.Identifier.make_namespace_members(module_name)
    J.assignment_expression(
      :=,
      J.member_expression(
        J.member_expression(
          J.identifier("Elixir"),
          J.identifier("__table__")
        ),
        J.call_expression(
          J.member_expression(
            J.identifier("Symbol"),
            J.identifier("for")
          ),
          [J.literal(ref.name)]
        ),
        true
      ),
      ref
    )
  end

end