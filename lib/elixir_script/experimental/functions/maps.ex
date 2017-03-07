defmodule ElixirScript.Experimental.Functions.Maps do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form

  def rewrite({{:., _, [:maps, :update]}, _, [key, value, map]}) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("Functions")
        ),
        J.identifier("update_map")
      ),
      [Form.compile(map), Form.compile(key), Form.compile(value)]
    )
  end

  def rewrite({{:., _, [:maps, :find]}, _, [key, map]}) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("Functions")
        ),
        J.identifier("update_map")
      ),
      [Form.compile(key), Form.compile(map)]
    )
  end

end
