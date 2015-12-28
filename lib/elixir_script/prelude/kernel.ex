defmodule ElixirScript.Kernel do
  import Kernel, only: [defmodule: 2, def: 1, def: 2, defp: 2,
  defmacro: 1, defmacro: 2, defmacrop: 2, ||: 2, !: 1, ++: 2, in: 2, &&: 2]

  defmacro if(condition, clauses) do
    build_if(condition, clauses)
  end

  defp build_if(condition, do: do_clause) do
    build_if(condition, do: do_clause, else: nil)
  end

  defp build_if(condition, do: do_clause, else: else_clause) do
    quote do
      case unquote(condition) do
        x when x in [false, nil] ->
          unquote(else_clause)
        _ ->
          unquote(do_clause)
      end
    end
  end

  defmacro unless(condition, clauses) do
    build_unless(condition, clauses)
  end

  defp build_unless(condition, do: do_clause) do
    build_unless(condition, do: do_clause, else: nil)
  end

  defp build_unless(condition, do: do_clause, else: else_clause) do
    quote do
      if(unquote(condition), do: unquote(else_clause), else: unquote(do_clause))
    end
  end

  def abs(number) do
    Math.abs(number)
  end

  def apply(fun, args) do
    Elixir.Core.Functions.apply(fun, args)
  end

  def apply(module, fun, args) do
    fun = if Elixir.Core.is_atom(fun), do: Atom.to_string(fun), else: fun
    Elixir.Core.Functions.apply(module, fun, args)
  end

  def binary_part(binary, start, len) do
    binary.substring(start, len)
  end

  def hd(list) do
    list[0]
  end

  def tl(list) do
    list.slice(1)
  end

  def is_atom(term) do
    Elixir.Core.Functions.is_atom(term)
  end

  def is_binary(term) do
    Elixir.Core.Functions.is_binary(term)
  end

  def is_bitstring(term) do
    Elixir.Core.Functions.is_bitstring(term)
  end

  def is_boolean(term) do
    Elixir.Core.Functions.is_boolean(term)
  end

  def is_float(term) do
    Elixir.Core.Functions.is_float(term)
  end

  def is_function(term) do
    Elixir.Core.Functions.is_function(term)
  end

  def is_function(term, arity) do
    Elixir.Core.Functions.is_function(term, arity)
  end

  def is_integer(term) do
    Elixir.Core.Functions.is_integer(term)
  end

  def is_list(term) do
    Elixir.Core.Functions.is_list(term)
  end

  def is_number(term) do
    Elixir.Core.Functions.is_integer(term) || Elixir.Core.Functions.is_float(term)
  end

  def is_pid(term) do
    Elixir.Core.Functions.is_pid(term)
  end

  def is_tuple(term) do
    Elixir.Core.Functions.is_tuple(term)
  end

  def is_map(term) do
    Elixir.Core.Functions.is_map(term)
  end

  def length(term) do
    Elixir.Core.Functions.size(term)
  end

  def map_size(term) do
    Elixir.Core.Functions.size(Object.keys(term))
  end

  def max(first, second) do
    Math.max(first, second)
  end

  def min(first, second) do
    Math.min(first, second)
  end

  def round(number) do
    Math.round(number)
  end

  def trunc(number) do
    Math.floor(number)
  end

  def tuple_size(tuple) do
    Elixir.Core.Functions.size(tuple)
  end

  def elem(tuple, index) do
    Elixir.Core.Functions.apply(tuple, "get", [index])
  end

  def is_nil(term) do
    Elixir.Core.Functions.is_nil(term)
  end

  defmacro match?(left, right) do
    quote do
      case unquote(right) do
        unquote(left) ->
          true
        _ ->
          false
      end
    end
  end

  defmacro to_string(arg) when Kernel.is_binary(arg) do
    arg
  end

  defmacro to_string(arg) do
    quote do
      String.Chars.to_string(unquote(arg))
    end
  end

  defmacro left |> {fun, context, params} do
    {fun, context, [left] ++ params }
  end

  defmacro left in right do
    quote do
      Elixir.Core.Functions.contains(unquote(left), unquote(right))
    end
  end

  defmacro first .. last do
    quote do
      %ElixirScript.Range{ first: unquote(first), last: unquote(last) }
    end
  end
end
