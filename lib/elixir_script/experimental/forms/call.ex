defmodule ElixirScript.Experimental.Forms.Call do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form
  alias ElixirScript.Translator.Identifier

  def compile({{:., _, [module, function]}, _, params}) do
    J.call_expression(
      J.member_expression(
        process_module_name(module),
        J.identifier("#{function}#{length(params)}")
      ),
      Enum.map(params, &Form.compile(&1))
    )
  end

  defp process_module_name(module) do
    first_char = String.first(to_string(module))

    case Regex.match?(~r/[A-Z]/, first_char) do
      true ->
        members = ["Elixir"] ++ Module.split(module)
        Identifier.make_namespace_members(members)
      false ->
        J.identifier(module)
    end
  end
end
