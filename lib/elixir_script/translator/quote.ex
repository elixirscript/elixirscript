defmodule ElixirScript.Translator.Quote do
  alias ESTree.Tools.Builder, as: JS
  alias ElixirScript.Translator
  alias ElixirScript.Translator.Primitive

  def make_quote(opts, expr) when is_number(expr) or is_binary(expr) or is_boolean(expr) or is_nil(expr) or is_atom(expr) do
    Translator.translate(expr)
  end

  def make_quote(opts, expr) when is_list(expr) do
    has_unquote_splicing = Enum.any?(expr, fn
      ({:unquote_splicing, _, _}) -> true
      (_) -> false 
    end)

    if(has_unquote_splicing) do
      expr = Enum.map(expr, fn
        ({:unquote_splicing, context, [param]}) ->
          make_unquote_slicing(param)
        (x) ->
          Primitive.make_list_no_translate([make_quote(opts, x)])
        end
      )

      JS.call_expression(
        JS.member_expression(
          JS.identifier("Enum"),
          JS.identifier("concat")
        ),
        expr
      )
    else
      Primitive.make_list_quoted(opts, expr)
    end
  end

  def make_quote(opts, {one, two}) do
    Primitive.make_tuple_quoted(opts, [one, two])
  end

  def make_quote([unquote: false] = opts, {:unquote, context, params}) do
    Primitive.make_tuple_quoted(opts, [:unquote, context, params])
  end

  def make_quote(opts, {:unquote, context, [param]}) do
    make_unquote(param)
  end

  def make_quote(opts, {name, context, elements }) do
    if is_in_bind_quoted(opts[:bind_quoted], name) do
      Translator.translate({name, context, elements })
    else
      Primitive.make_tuple_quoted(opts, [name, context, elements])
    end
  end

  def make_unquote(expr) do
    Translator.translate(expr)
  end

  def make_unquote_slicing(expr) do
    Translator.translate(expr)
  end

  defp is_in_bind_quoted(nil, name) do
    false
  end

  defp is_in_bind_quoted(binds, name) do
    binds[name] != nil
  end

end