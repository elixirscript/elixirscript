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
    Math.abs(number)
  end

  def apply(fun, args) do
    Elixir.Core.Functions.apply(fun, args)
  end

  def apply(module, fun, args) do
    Elixir.Core.Functions.apply(module, Atom.to_string(fun), args)
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
    is_binary(term) || JS.instanceof(term, Elixir.Core.BitString)
  end

  def is_boolean(term) do
    JS.typeof(term) === "boolean" || JS.instanceof(term, Boolean)
  end

  def is_float(term) do
    is_number(term) && !Number.isInteger(term)
  end

  def is_function(term) do
    is_function(term, 0)
  end

  def is_function(term, _) do
    JS.typeof(term) === "function" || JS.instanceof(term, Function)
  end

  def is_integer(term) do
    Number.isInteger(term)
  end

  def is_list(term) do
    Array.isArray(term)
  end

  def is_number(term) do
    JS.typeof(term) === "number" || JS.instanceof(term, Number)
  end

  def is_pid(term) do
    JS.instanceof(term, Elixir.Core.PID)
  end

  def is_tuple(term) do
    JS.instanceof(term, Elixir.Core.Tuple)
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
    Object.keys(term).length
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
    term === nil
  end

  def make_ref() do
    Elixir.Core.processes.make_ref()
  end

  def spawn(gen) do
    Elixir.Core.processes.spawn(gen)
  end

  def spawn(module, fun, args) do
    Elixir.Core.processes.spawn(module, Atom.to_string(fun), args)
  end

  def spawn_link(gen) do
    Elixir.Core.processes.spawn_link(gen)
  end

  def spawn_link(module, fun, args) do
    Elixir.Core.processes.spawn_link(module, Atom.to_string(fun), args)
  end

  def spawn_monitor(gen) do
    Elixir.Core.processes.spawn_monitor(gen)
  end

  def spawn_monitor(module, fun, args) do
    Elixir.Core.processes.spawn_monitor(module, Atom.to_string(fun), args)
  end

  def send(pid, message) do
    Elixir.Core.processes.send(pid, message)
  end

  def self() do
    Elixir.Core.processes.pid()
  end

  def sigil_r({:<<>>, _meta, [string]}, options) do
    JS.new(RegExp, [string, options])
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
