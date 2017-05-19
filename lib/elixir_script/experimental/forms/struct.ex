defmodule ElixirScript.Experimental.Forms.Struct do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Translator.Identifier

  def compile({:%, _, [module, params]}, state) do
    J.call_expression(
      J.member_expression(
        process_module_name(module),
        J.identifier("__struct__1")
      ),
      [Form.compile(params, state)]
    )
  end

  defp process_module_name(module) do
    members = ["Elixir"] ++ Module.split(module)
    Identifier.make_namespace_members(members)
  end
end
