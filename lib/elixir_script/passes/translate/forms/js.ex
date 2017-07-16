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

  def compile({{:., _, [ElixirScript.JS, :debugger]}, _, _}, state) do
    ast = J.debugger_statement()
    {ast, state}
  end

  def compile({{:., _, [ElixirScript.JS, :this]}, _, _}, state) do
    ast = J.this_expression()
    {ast, state}
  end

  def compile({{:., _, [ElixirScript.JS, :new]}, _, [module, params]}, state) do
    members = Module.split(module)

    members = case members do
      ["JS" | rest] ->
        rest
      x ->
        x
    end

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

  def compile({{:., _, [ElixirScript.JS, :throw]}, _, [term]}, state) do
    ast = J.throw_statement(
      Form.compile!(term, state)
    )

    {ast, state}
  end

  def compile({{:., _, [ElixirScript.JS, :import]}, _, [term]}, state) do
    ast = J.call_expression(
      J.identifier("import"),
      [Form.compile!(term, state)]
    )

    {ast, state}
  end

  def compile({{:., _, [ElixirScript.JS, :mutate]}, _, [object, map]}, state) do
    ast = J.call_expression(
      J.member_expression(
        J.identifier("Object"),
        J.identifier("assign")
      ),
      [
        Form.compile!(object, state),
        Form.compile!(map, state)
      ]
    )

    {ast, state}
  end

  def compile({{:., _, [ElixirScript.JS, :mutate]}, _, [object, key, value]}, state) do
    ast = J.assignment_expression(
      :=,
      J.member_expression(
        Form.compile!(object, state),
        Form.compile!(key, state),
        true
      ),
      [
        Form.compile!(value, state)
      ]
    )

    {ast, state}
  end
end
