defmodule ElixirScript.Translate.Functions.Lists do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form

  def rewrite({{:., _, [:lists, :map]}, _, [fun, list]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(list, state),
        J.identifier("map")
      ),
      [Form.compile(fun, state)]
    )
  end

  def rewrite({{:., _, [:lists, :member]}, _, [elem, list]}, state) do
    J.binary_expression(
      :>,
      J.call_expression(
        J.member_expression(
          Form.compile(list, state),
          J.identifier("indexOf")
        ),
        [Form.compile(elem, state)]
      ),
      J.unary_expression(
        :-,
        true,
        J.literal(1)
      )
    )
  end

  def rewrite({{:., _, [:lists, :reverse]}, _, [list]}, state) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            Form.compile(list, state),
            J.identifier("concat")
          ),
          [J.array_expression([])]
        ),
        J.identifier("reverse")
      ),
      []
    )
  end

  def rewrite({{:., _, [:lists, :reverse]}, _, [list, tail]}, state) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            J.call_expression(
              J.member_expression(
                Form.compile(list, state),
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
      [Form.compile(tail, state)]
    )
  end

  def rewrite({{:., _, [:lists, :sort]}, _, [list]}, state) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            Form.compile(list, state),
            J.identifier("concat")
          ),
          [J.array_expression([])]
        ),
        J.identifier("sort")
      ),
      []
    )
  end

  def rewrite({{:., _, [:lists, :filter]}, _, [pred, list]}, state) do
    J.call_expression(
      J.member_expression(
        Form.compile(list, state),
        J.identifier("filter")
      ),
      [Form.compile(pred, state)]
    )
  end

  def rewrite({{:., _, [:lists, :delete]}, _, [elem, list]}, state) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("Functions")
        ),
        J.identifier("remove_from_list")
      ),
      [Form.compile(list, state), Form.compile(elem, state)]
    )
  end

  def rewrite({{:., _, [:lists, _]}, _, [elem, list]}, state) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("Functions")
        ),
        J.identifier("remove_from_list")
      ),
      [Form.compile(list, state), Form.compile(elem, state)]
    )
  end

  def rewrite({{:., _, [:lists, _]}, _, [elem, list, _, _]}, state) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("Functions")
        ),
        J.identifier("remove_from_list")
      ),
      [Form.compile(list, state), Form.compile(elem, state)]
    )
  end

  def rewrite({{:., _, [:lists, _]}, _, [elem, list, _]}, state) do
    J.call_expression(
      J.member_expression(
        J.member_expression(
          J.member_expression(
            J.identifier("Bootstrap"),
            J.identifier("Core")
          ),
          J.identifier("Functions")
        ),
        J.identifier("remove_from_list")
      ),
      [Form.compile(list, state), Form.compile(elem, state)]
    )
  end

  def rewrite({{:., _, [:lists, _]}, _, [list]}, state) do
    J.call_expression(
      J.member_expression(
        J.call_expression(
          J.member_expression(
            Form.compile(list, state),
            J.identifier("concat")
          ),
          [J.array_expression([])]
        ),
        J.identifier("reverse")
      ),
      []
    )
  end

end
