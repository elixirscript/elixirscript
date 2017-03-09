defmodule ElixirScript.Experimental.Forms.Call do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Translator.Identifier

  def compile({{:., _, [module, function]}, _, params}) do
    J.call_expression(
      J.member_expression(
        process_module_name(module),
        ElixirScript.Translator.Identifier.make_function_name(function, length(params))
      ),
      Enum.map(params, &Form.compile(&1))
    )
  end

  defp process_module_name(module) when is_atom(module) do
    if ElixirScript.Experimental.Module.is_elixir_module(module) do
      members = ["Elixir"] ++ Module.split(module)
      J.identifier(Enum.join(members, "_"))
    else
      ElixirScript.Translator.Identifier.make_identifier(module)
    end
  end

  defp process_module_name(module) do
    Form.compile(module)
  end
end
