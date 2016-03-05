defmodule ElixirScript.ModuleSystems.Common do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Utils

  def import_module(module_name, from, env) do
    ref_declarator = JS.variable_declarator(
      Translator.translate!(module_name, env),
      JS.call_expression(
        JS.identifier("require"),
        [JS.literal(from)]
      )
    )

    JS.variable_declaration([ref_declarator], :const)
  end

  def import_module(module_name, %ElixirScript.Macro.Env{} = env) do
    {from, _ } = Code.eval_quoted(module_name)

    ref_declarator = JS.variable_declarator(
      Translator.translate!(module_name, env),
      JS.call_expression(
        JS.identifier("require"),
        [JS.literal(Macro.underscore(from))]
      )
    )

    JS.variable_declaration([ref_declarator], :const)

  end

  def import_module(import_name, from) do

    ref_declarator = JS.variable_declarator(
      JS.identifier(import_name),
      JS.call_expression(
        JS.identifier("require"),
        [JS.literal(from)]
      )
    )

    JS.variable_declaration([ref_declarator], :const)
  end

  defp do_import_module(import_specifiers, file_path) do
    JS.import_declaration(
      import_specifiers,
      JS.literal(file_path)
    )
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
