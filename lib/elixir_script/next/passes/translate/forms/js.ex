defmodule ElixirScript.Translate.Forms.JS do
  @moduledoc false
  alias ESTree.Tools.Builder, as: J
  alias ElixirScript.Translate.Form

  def global() do
    Builder.member_expression(
      Builder.member_expression(
        Builder.identifier("Bootstrap"),
        Builder.identifier("Core")
      ),
      Builder.identifier("global")
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
      p ->
        [J.rest_element(Form.compile!(params, state))]
    end

    ast = J.new_expression(
      ElixirScript.Translate.Identifier.make_namespace_members(members),
      params
    )

    {ast, state}
  end

  defp do_translate({{:., _, [JS, :throw]}, _, [term]}, state) do
    ast = J.throw_statement(
      Form.compile!(term, state)
    )

    {ast, state}
  end

  defp do_translate({{:., _, [JS, :import]}, _, [term]}, state) do
    ast = J.call_expression(
      J.identifier("import"),
      [Form.compile!(term, state)]
    )

    {ast, state}
  end

  defp do_translate({{:., _, [JS, function]}, _, params}, state) do
    ast = J.call_expression(
      J.identifier(function),
      Enum.map(params, &Form.compile!(&1, state))
    )

    {ast, state}
  end
end