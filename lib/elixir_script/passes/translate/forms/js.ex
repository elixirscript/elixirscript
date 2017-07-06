defmodule ElixirScript.Translate.Forms.JS do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form

  def call_property() do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.member_expression(
          J.identifier("Core"),
          J.identifier("Functions")
        )
      ),
      J.identifier("call_property")
    )
  end

  def global() do
    J.member_expression(
      J.member_expression(
        J.identifier("Bootstrap"),
        J.identifier("Core")
      ),
      J.identifier("global")
    )
  end

  def compile({{:., _, [JS, :debugger]}, _, _}, state) do
    ast = J.debugger_statement()
    {ast, state}
  end

  def compile({{:., _, [JS, :this]}, _, _}, state) do
    ast = J.this_expression()
    {ast, state}
  end

  def compile({{:., _, [JS, :new]}, _, [module, params]}, state) do
    members = Module.split(module)

    params = case params do
      p when is_list(p) ->
        Enum.map(params, &Form.compile!(&1, state))
      _ ->
        [J.rest_element(Form.compile!(params, state))]
    end

    ast = J.new_expression(
      ElixirScript.Translate.Identifier.make_namespace_members(members),
      params
    )

    {ast, state}
  end

  def compile({{:., _, [JS, :throw]}, _, [term]}, state) do
    ast = J.throw_statement(
      Form.compile!(term, state)
    )

    {ast, state}
  end

  def compile({{:., _, [JS, :import]}, _, [term]}, state) do
    ast = J.call_expression(
      J.identifier("import"),
      [Form.compile!(term, state)]
    )

    {ast, state}
  end

  def compile({{:., _, [JS, function]}, _, []}, state) do
    ast = J.call_expression(
      call_property(),
      [
        global(),
        Form.compile!(to_string(function), state)
      ]
    )

    {ast, state}
  end

  def compile({{:., _, [JS, function]}, _, params}, state) do
    ast = J.call_expression(
      J.identifier(function),
      Enum.map(params, &Form.compile!(&1, state))
    )

    {ast, state}
  end
end
