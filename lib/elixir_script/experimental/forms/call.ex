defmodule ElixirScript.Experimental.Forms.Call do
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form

  def compile({{:., _, [module, function]}, _, params}) do
    J.call_expression(
      J.member_expression(
        J.identifier(module),
        J.identifier("#{function}#{length(params)}")
      ),
      Enum.map(params, &Form.compile(&1))
    )
  end
end