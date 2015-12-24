defmodule ElixirScript.Translator.Primitive do
  @moduledoc false
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Quote
  alias ElixirScript.Translator.Utils

  def special_forms() do
    JS.member_expression(
      JS.identifier("Elixir"),
      JS.member_expression(
        JS.identifier("Kernel"),
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

  def make_identifier({:__aliases__, _, aliases}) do
    Utils.make_module_expression_tree(aliases, false, __ENV__)
  end

  def make_identifier([ast]) do
    JS.identifier(ast)
  end

  def make_identifier(ast) do
    JS.identifier(ast)
  end

  def make_literal(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    JS.literal(ast)
  end

  def make_atom(ast) when is_atom(ast) do
    JS.call_expression(
      JS.member_expression(
        special_forms(),
        JS.identifier("atom")
      ),
      [JS.literal(ast)]
    )
  end

  def make_list([{:|, _, [_, _]} = ast], env) do
    Translator.translate(ast, env)
  end

  def make_list(ast, env) when is_list(ast) do
    list = Enum.map(ast, &Translator.translate!(&1, env))

    js_ast = JS.call_expression(
      JS.member_expression(
        special_forms(),
        JS.identifier("list")
      ),
      list
    )

    { js_ast, env }
  end

  def make_list_quoted(opts, ast, env) when is_list(ast) do
    JS.call_expression(
      JS.member_expression(
        special_forms(),
        JS.identifier("list")
      ),
      Enum.map(ast, fn(x) -> Quote.make_quote(opts, x, env) end)
    )
  end

  def make_list_no_translate(ast) when is_list(ast) do
    JS.call_expression(
      JS.member_expression(
        special_forms(),
        JS.identifier("list")
      ),
      ast
    )
  end

  def make_tuple({ one, two }, env) do
    make_tuple([one, two], env)
  end

  def make_tuple(elements, env) do
    list = Enum.map(elements, &Translator.translate!(&1, env))

    js_ast = JS.call_expression(
      JS.member_expression(
        special_forms(),
        JS.identifier("tuple")
      ),
      list
    )

    { js_ast, env }
  end

  def make_tuple_no_translate(elements) do
    JS.call_expression(
      JS.member_expression(
        special_forms(),
        JS.identifier("tuple")
      ),
      elements
    )
  end

  def make_tuple_quoted(opts, elements, env) do
    JS.call_expression(
      JS.member_expression(
        special_forms(),
        JS.identifier("tuple")
      ),
      Enum.map(elements, fn(x) -> Quote.make_quote(opts, x, env) end)
    )
  end

end
