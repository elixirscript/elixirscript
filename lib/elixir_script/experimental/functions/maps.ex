defmodule ElixirScript.Experimental.Functions.Maps do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form

  def rewrite({{:., _, [:maps, :update]}, _, [key, value, map]}, state) do
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
      [Form.compile(map, state), Form.compile(key, state), Form.compile(value, state)]
    )
  end

  def rewrite({{:., _, [:maps, :find]}, _, [key, map]}, state) do
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
      [Form.compile(key, state), Form.compile(map, state)]
    )
  end

  def rewrite({{:., _, [:maps, :put]}, _, [key, map, _]}, state) do
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
      [Form.compile(key, state), Form.compile(map, state)]
    )
  end

  def rewrite({{:., _, [:maps, :is_key]}, _, [key, map]}, state) do
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
      [Form.compile(key, state), Form.compile(map, state)]
    )
  end

    def rewrite({{:., _, [:maps, _]}, _, _}, state) do
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
      []
    )
  end
end
