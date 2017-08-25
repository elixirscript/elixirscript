defmodule ElixirScript.Translate.Helpers do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J

  def symbol(value) do
    J.call_expression(
      J.member_expression(
        J.identifier("Symbol"),
        J.identifier("for")
      ),
      [J.literal(value)]
    )
  end

  def new(callee, arguments) do
    J.new_expression(
      callee,
      arguments
    )
  end

  def call(callee, arguments) do
    J.call_expression(
      callee,
      arguments
    )
  end

  def arrow_function(params, body) do
    J.arrow_function_expression(
      params,
      [],
      body
    )
  end

  def function(%ESTree.Identifier{} = name, params, body) do
    J.function_declaration(
      name,
      params,
      [],
      body
    )
  end

  def function(name, params, body) when is_binary(name) do
    function(J.identifier(name), params, body)
  end

  def function(params, body) do
    J.function_expression(
      params,
      [],
      body
    )
  end

  def core do
    J.member_expression(
      J.identifier("ElixirScript"),
      J.identifier("Core")
    )
  end

  def core_module(module) do
    J.member_expression(
      core(),
      J.identifier(module)
    )
  end

  def tuple do
    core_module("Tuple")
  end

  def bitstring do
    core_module("BitString")
  end

  def patterns do
    core_module("Patterns")
  end

  def functions do
    core_module("Functions")
  end

  def special_forms do
    core_module("SpecialForms")
  end

  def declare(%ESTree.Identifier{} = name, value) do
    declarator = J.variable_declarator(
      name,
      value
    )

    J.variable_declaration([declarator], :const)
  end

  def declare(names, value) when is_list(names) do
    declarator = J.variable_declarator(
      J.array_pattern(names),
      value
    )

    J.variable_declaration([declarator], :const)
  end

  def declare(name, value) when is_binary(name) do
    declare(J.identifier(name), value)
  end

  def declare_let(name, value) do
    declarator = J.variable_declarator(
      J.identifier(name),
      value
    )

    J.variable_declaration([declarator], :let)
  end

end
