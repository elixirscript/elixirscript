defmodule ElixirScript.Output.JSModule do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J

  def compile(body, opts, js_modules) do
    declarator = J.variable_declarator(
      J.identifier("Elixir"),
      J.object_expression([])
    )

    elixir = J.variable_declaration([declarator], :const)

    ast = opts.module_formatter.build(
      js_modules,
      [elixir, create_atom_table(), start(), load()] ++ body,
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
              J.member_expression(
                J.identifier("ElixirScript"),
                J.member_expression(
                  J.identifier(:Core),
                  J.member_expression(
                    J.identifier(:global),
                    J.identifier(:__process_system__)
                  )
                )
              ),
              J.identifier(:spawn_link)
            ),
            [
              J.call_expression(
                J.member_expression(
                  J.identifier(:app),
                  J.identifier("__load")
                ),
                [J.identifier("Elixir")]
              ),
              J.literal("start"),
              J.array_expression([normal, J.identifier(:args)])
            ]
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

end
