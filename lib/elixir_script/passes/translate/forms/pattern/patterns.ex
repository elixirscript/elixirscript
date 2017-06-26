defmodule ElixirScript.Translate.Forms.Pattern.Patterns do
  @moduledoc false

  alias ESTree.Tools.Builder, as: J
  
  @patterns J.member_expression(
    J.member_expression(
    J.identifier("Bootstrap"),
    J.identifier("Core")
    ),
    J.identifier("Patterns")
  )

  @wildcard J.member_expression(
    @patterns,
    J.identifier(:wildcard)
  )

  @parameter J.member_expression(
    @patterns,
    J.identifier(:variable)
  )

  @head_tail J.member_expression(
    @patterns,
    J.identifier(:headTail)
  )

  @starts_with J.member_expression(
    @patterns,
    J.identifier(:startsWith)
  )

  @capture J.member_expression(
    @patterns,
    J.identifier(:capture)
  )

  @bound J.member_expression(
    @patterns,
    J.identifier(:bound)
  )

  @_type J.member_expression(
    @patterns,
    J.identifier(:type)
  )

  @bitstring_match J.member_expression(
    @patterns,
    J.identifier(:bitStringMatch)
  )

  def wildcard() do
    J.call_expression(
      @wildcard,
      []
    )
  end

  def parameter() do
    J.call_expression(
      @parameter,
      []
    )
  end

  def parameter(default_value) do
    J.call_expression(
      @parameter,
      [default_value]
    )
  end

  def head_tail(headParameter, tailParameter) do
    J.call_expression(
      @head_tail,
      [headParameter, tailParameter]
    )
  end

  def starts_with(prefix) do
    J.call_expression(
      @starts_with,
      [J.literal(prefix)]
    )
  end

  def capture(value) do
    J.call_expression(
      @capture,
      [value]
    )
  end

  def bound(value) do
    J.call_expression(
      @bound,
      [value]
    )
  end

  def type(prototype, value) do
    J.call_expression(
      @_type,
      [prototype, value]
    )
  end

  def bitstring_match(values) do
    J.call_expression(
      @bitstring_match,
      values
    )
  end
end