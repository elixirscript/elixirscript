defmodule ElixirScript.Output.JSModule do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Helpers

  def compile(body, opts, js_modules) do
    elixir = Helpers.declare("Elixir", J.object_expression([]))

    imports = opts.module_formatter.build_imports(js_modules)
    exports = opts.module_formatter.build_export(J.identifier("Elixir"))

    [elixir, create_atom_table(), start(), load(), imports] ++ body ++ [exports]
  end

  def start do
    start_process_call = Helpers.call_sync(
      J.member_expression(
        Helpers.process_system(),
        J.identifier("spawn")
      ),
      [
        Helpers.call_sync(
          J.member_expression(
            J.identifier(:app),
            J.identifier("__load")
          ),
          [J.identifier("Elixir")]
        ),
        J.literal("start"),
        J.array_expression([
          Helpers.symbol("normal"),
          J.identifier(:args)
        ])
      ]
    )


    Helpers.assign(
      J.member_expression(
        J.identifier("Elixir"),
        J.identifier("start")
      ),
      Helpers.function(
        [J.identifier(:app), J.identifier(:args)],
        J.block_statement([
          start_process_call
        ])
      )
    )
  end

  def load do
    Helpers.assign(
      J.member_expression(
        J.identifier("Elixir"),
        J.identifier("load")
      ),
      Helpers.function(
        [J.identifier(:module)],
        J.block_statement([
          J.return_statement(
            Helpers.call_sync(
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
    Helpers.assign(
      J.member_expression(
        J.identifier("Elixir"),
        J.identifier("__table__")
      ),
      J.object_expression([])
    )
  end

end
