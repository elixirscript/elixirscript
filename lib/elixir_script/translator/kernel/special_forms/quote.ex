defmodule ElixirScript.Translator.Quote do
  @moduledoc false

  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive

  def make_quote(_opts, expr, env) when is_number(expr) or is_binary(expr) or is_boolean(expr) or is_nil(expr) or is_atom(expr) do
    Translator.translate!(expr, env)
  end

  def make_quote(opts, expr, env) when is_list(expr) do
    has_unquote_splicing = Enum.any?(expr, fn
      ({:unquote_splicing, _, _}) -> true
      (_) -> false
    end)

    if has_unquote_splicing do
      expr = Enum.map(expr, fn
        ({:unquote_splicing, _, [param]}) ->
          make_unquote_slicing(param, env)
        (x) ->
          Primitive.make_list_no_translate([make_quote(opts, x, env)])
        end
      )

      JS.call_expression(
        JS.member_expression(
          JS.identifier("Bootstrap"),
          JS.member_expression(
            JS.identifier("Enum"),
            JS.identifier("concat")
          )
        ),
        expr
      )
    else
      Primitive.make_list_quoted(opts, expr, env)
    end
  end

  def make_quote(opts, {one, two}, env) do
    Primitive.make_tuple_quoted(opts, [one, two], env)
  end

  def make_quote([unquote: false] = opts, {:unquote, context, params}, env) do
    Primitive.make_tuple_quoted(opts, [:unquote, context, params], env)
  end

  def make_quote([context: {_, _, [new_context]}] = opts, {name, context, params}, env) do
    updated_context = Keyword.put(context, :context, new_context)
    Primitive.make_tuple_quoted(opts, [name, updated_context, params], env)
  end

  def make_quote(_, {:alias!, _, [the_alias]}, _) do
    the_alias
  end

  def make_quote(_, {:unquote, _, [param]}, env) do
    make_unquote(param, env)
  end

  def make_quote(opts, {name, context, elements }, env) do
    if is_in_bind_quoted(opts[:bind_quoted], name) do
      Translator.translate!({name, context, elements }, env)
    else
      Primitive.make_tuple_quoted(opts, [name, context, elements], env)
    end
  end

  def make_unquote(expr, env) do
    Translator.translate!(expr, env)
  end

  def make_unquote_slicing(expr, env) do
    Translator.translate!(expr, env)
  end

  defp is_in_bind_quoted(nil, _) do
    false
  end

  defp is_in_bind_quoted(binds, name) do
    binds[name] != nil
  end

end
