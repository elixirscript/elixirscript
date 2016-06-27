defmodule ElixirScript.Translator.Primitive do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Quote

  def special_forms() do
    JS.member_expression(
      JS.identifier("Elixir"),
      JS.member_expression(
        JS.identifier("Core"),
        JS.identifier("SpecialForms")
      )
    )
  end

  def tuple_class() do
    JS.member_expression(
      JS.member_expression(
        JS.identifier("Elixir"),
        JS.identifier("Core")
      ),
      JS.identifier("Tuple")
    )
  end

  def list_ast() do
    JS.member_expression(
      JS.member_expression(
        JS.identifier("Elixir"),
        JS.member_expression(
          JS.identifier("Core"),
          JS.identifier("SpecialForms")
        )
      ),
      JS.identifier("list")
    )
  end

  def make_atom(ast) when is_atom(ast) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier("Symbol"),
        JS.identifier("for")
      ),
      [JS.literal(ast)]
    )
  end

  def make_literal(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    JS.literal(ast)
  end

  def make_list(ast, env) when is_list(ast) do
    js_ast = Enum.map(ast, &Translator.translate!(&1, env))
    |> do_make_list

    { js_ast, env }
  end

  def make_list_quoted(opts, ast, env) when is_list(ast) do
    Enum.map(ast, fn(x) -> Quote.make_quote(opts, x, env) end)
    |> do_make_list
  end

  def make_list_no_translate(ast) when is_list(ast) do
    do_make_list(ast)
  end

  def do_make_list(ast) do
    JS.call_expression(
      JS.member_expression(
        JS.identifier("Object"),
        JS.identifier("freeze")
      ),
      [JS.array_expression(ast)]
    )
  end

  def make_tuple({ one, two }, env) do
    make_tuple([one, two], env)
  end

  def make_tuple(elements, env) do
    list = Enum.map(elements, &Translator.translate!(&1, env))

    js_ast = JS.new_expression(tuple_class, list)

    { js_ast, env }
  end

  def make_tuple_quoted(opts, elements, env) do
    JS.new_expression(
      tuple_class,
      Enum.map(elements, fn(x) -> Quote.make_quote(opts, x, env) end)
    )
  end

end
