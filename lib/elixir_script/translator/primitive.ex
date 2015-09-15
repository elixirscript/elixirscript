defmodule ElixirScript.Translator.Primitive do
  @moduledoc false
  alias ESTree.Tools.Builder
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Quote
  alias ElixirScript.Translator.Utils

  def make_wildcard() do
    Builder.member_expression(
      Builder.identifier("fun"),
      Builder.identifier("wildcard")
    )
  end

  def make_identifier({:__aliases__, _, aliases}) do
    Utils.make_module_expression_tree(aliases, false, __ENV__)
  end

  def make_identifier([ast]) do
    Builder.identifier(ast)
  end

  def make_identifier(ast) do
    Builder.identifier(ast)
  end

  def make_literal(ast) when is_number(ast) or is_binary(ast) or is_boolean(ast) or is_nil(ast) do
    Builder.literal(ast)
  end

  def make_atom(ast) when is_atom(ast) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("atom")
      ),
      [Builder.literal(ast)]
    )
  end

  def make_list(ast, env) when is_list(ast) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("list")
      ),
      Enum.map(ast, fn(x) -> Translator.translate(x, env) end)
    )
  end

  def make_list_quoted(opts, ast, env) when is_list(ast) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("list")
      ),
      Enum.map(ast, fn(x) -> Quote.make_quote(opts, x, env) end)
    )
  end

  def make_list_no_translate(ast) when is_list(ast) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("list")
      ),
      ast
    )
  end

  def make_tuple({ one, two }, env) do
    make_tuple([one, two], env)
  end

  def make_tuple(elements, env) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("tuple")
      ),
      Enum.map(elements, fn(x) -> Translator.translate(x, env) end)
    )
  end

  def make_tuple_quoted(opts, elements, env) do
    Builder.call_expression(
      Builder.member_expression(
        Builder.identifier("Erlang"),
        Builder.identifier("tuple")
      ),
      Enum.map(elements, fn(x) -> Quote.make_quote(opts, x, env) end)
    )
  end

end
