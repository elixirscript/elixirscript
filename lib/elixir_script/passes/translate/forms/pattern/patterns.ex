defmodule ElixirScript.Translate.Forms.Pattern.Patterns do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Helpers

  @parameter J.member_expression(
    Helpers.patterns(),
    J.identifier(:variable)
  )

  @head_tail J.member_expression(
    Helpers.patterns(),
    J.identifier(:headTail)
  )

  @starts_with J.member_expression(
    Helpers.patterns(),
    J.identifier(:startsWith)
  )

  @capture J.member_expression(
    Helpers.patterns(),
    J.identifier(:capture)
  )

  @bound J.member_expression(
    Helpers.patterns(),
    J.identifier(:bound)
  )

  @_type J.member_expression(
    Helpers.patterns(),
    J.identifier(:type)
  )

  @bitstring_match J.member_expression(
    Helpers.patterns(),
    J.identifier(:bitStringMatch)
  )

  def parameter() do
    Helpers.call_sync(
      @parameter,
      []
    )
  end

  def parameter(name) do
    Helpers.call_sync(
      @parameter,
      [name]
    )
  end

  def head_tail(headParameter, tailParameter) do
    Helpers.call_sync(
      @head_tail,
      [headParameter, tailParameter]
    )
  end

  def starts_with(prefix) do
    Helpers.call_sync(
      @starts_with,
      [J.literal(prefix)]
    )
  end

  def capture(value) do
    Helpers.call_sync(
      @capture,
      [value]
    )
  end

  def bound(value) do
    Helpers.call_sync(
      @bound,
      [value]
    )
  end

  def type(prototype, value) do
    Helpers.call_sync(
      @_type,
      [prototype, value]
    )
  end

  def bitstring_match(values) do
    Helpers.call_sync(
      @bitstring_match,
      values
    )
  end
end
