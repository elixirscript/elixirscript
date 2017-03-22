defmodule ElixirScript.Kernel do
  @moduledoc false
  import Kernel, only: [defmodule: 2, def: 1, def: 2, defp: 2,
                        defmacro: 1, defmacro: 2, defmacrop: 2, ||: 2, !: 1,
                        ++: 2, in: 2, &&: 2, ===: 2, @: 1, sigil_r: 2]
  require JS


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
    JS.Math.abs(number)
  end

  def apply(fun, args) do
    fun.apply(fun, args)
  end

  def apply(module, fun, args) do
    module[Atom.to_string(fun)].apply(module[Atom.to_string(fun)], args)
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
    JS.typeof(term) === "symbol"
  end

  def is_binary(term) do
    JS.typeof(term) === "string"
  end

  def is_bitstring(term) do
    is_binary(term) || JS.instanceof(term, Bootstrap.Core.BitString)
  end

  def is_boolean(term) do
    JS.typeof(term) === "boolean" || JS.instanceof(term, Boolean)
  end

  def is_float(term) do
    is_number(term) && !JS.Number.isInteger(term)
  end

  def is_function(term) do
    is_function(term, 0)
  end

  def is_function(term, _) do
    JS.typeof(term) === "function" || JS.instanceof(term, Function)
  end

  def is_integer(term) do
    JS.Number.isInteger(term)
  end

  def is_list(term) do
    JS.Array.isArray(term)
  end

  def is_number(term) do
    JS.typeof(term) === "number" || JS.instanceof(term, Number)
  end

  def is_pid(term) do
    JS.instanceof(term, Bootstrap.Core.PID)
  end

  def is_tuple(term) do
    JS.instanceof(term, Bootstrap.Core.Tuple)
  end

  def is_map(term) do
    JS.typeof(term) === "object" || JS.instanceof(term, Object)
  end

  def is_port(_) do
    false
  end

  def is_reference(_) do
    false
  end

  def length(term) do
    term.length
  end

  def map_size(term) do
    JS.Object.keys(term).length
  end

  def max(first, second) do
    JS.Math.max(first, second)
  end

  def min(first, second) do
    JS.Math.min(first, second)
  end

  def round(number) do
    JS.Math.round(number)
  end

  def trunc(number) do
    JS.Math.floor(number)
  end

  def tuple_size(tuple) do
    tuple.count()
  end

  def elem(tuple, index) do
    tuple.get(index)
  end

  def is_nil(term) do
    term === nil
  end

  defmacro sigil_r({:<<>>, _meta, [string]}, options) do
    str_options = List.to_string(options)
    quote do
      Regex.compile!(unquote(string), unquote(str_options))
    end
  end

  defmacro match?(pattern, expr) do
    quote do
      case unquote(expr) do
        unquote(pattern) ->
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
      ElixirScript.Bootstrap.Functions.contains(unquote(left), unquote(right))
    end
  end

  defmacro first .. last do
    quote do
      %ElixirScript.Range{ first: unquote(first), last: unquote(last) }
    end
  end
end
