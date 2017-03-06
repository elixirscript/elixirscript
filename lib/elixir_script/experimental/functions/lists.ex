defmodule ElixirScript.Experimental.Functions.Lists do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Experimental.Form

  def rewrite({{:., _, [:lists, :map]}, _, [fun, list]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(list),
        J.identifier("map")
      ),
      [Form.compile(fun)]
    )
  end

  def rewrite({{:., _, [:lists, :member]}, _, [elem, list]}) do
    J.binary_expression(
      :>,
      J.call_expression(
        J.member_expression(
          Form.compile(list),
          J.identifier("indexOf")
        ),
        [Form.compile(elem)]
      ),
      J.unary_expression(
        :-,
        true,
        J.literal(1)
      )
    )
  end

  def rewrite({{:., _, [:lists, :reverse]}, _, [list]}) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            Form.compile(list),
            J.identifier("concat")
          ),
          [J.array_expression([])]
        ),
        J.identifier("reverse")
      ),
      []
    )
  end

  def rewrite({{:., _, [:lists, :reverse]}, _, [list, tail]}) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            J.call_expression(
              J.member_expression(
                Form.compile(list),
                J.identifier("concat")
              ),
              [J.array_expression([])]
            ),
            J.identifier("reverse")
          ),
          []
        ),
        J.identifier("concat")
      ),
      [Form.compile(tail)]
    )
  end

  def rewrite({{:., _, [:lists, :sort]}, _, [list]}) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            Form.compile(list),
            J.identifier("concat")
          ),
          [J.array_expression([])]
        ),
        J.identifier("sort")
      ),
      []
    )
  end

  def rewrite({{:., _, [:lists, :filter]}, _, [pred, list]}) do
    J.call_expression(
      J.member_expression(
        Form.compile(list),
        J.identifier("filter")
      ),
      [Form.compile(pred)]
    )
  end

end
