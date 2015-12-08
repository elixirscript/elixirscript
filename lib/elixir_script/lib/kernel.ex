defmodule ElixirScript.Kernel do

  def abs(number) do
    Math.abs(number)
  end

  def apply(fun, args) do
    fun.apply(nil, args)
  end

  def apply(module, fun, args) do
    module[fun].apply(nil, args)
  end

  def binary_part(binary, start, length) do
    binary.substring(start, length)
  end

  def div(left, right) do
    left / right
  end

  def hd(list) do
    list[0]
  end

  def tl(list) do
    list.slice(1)
  end

  defmacro is_atom(term) do
    quote do
      typeof(unquote(term)) === "symbol"
    end
  end

  defmacro is_binary(term) do
    quote do
      typeof(unquote(term)) === "string" || Elixir.Core.is_instance_of(unquote(term), String);
    end
  end

  defmacro is_bitstring(term) do
    quote do
      Elixir.Core.is_instance_of(unquote(term), Elixir.Core.BitString);
    end
  end

  defmacro is_boolean(term) do
    quote do
      typeof(unquote(term)) === "boolean" || Elixir.Core.is_instance_of(unquote(term), Boolean);
    end
  end

  defmacro is_float(term) do
    quote do
      is_number(unquote(term)) && !Number.isInteger(unquote(term))
    end
  end

  defmacro is_function(term) do
    quote do
      typeof(unquote(term)) === "function" || Elixir.Core.is_instance_of(unquote(term), Function);
    end
  end

  defmacro is_function(term, _arity) do
    quote do
      typeof(unquote(term)) === "function" || Elixir.Core.is_instance_of(unquote(term), Function);
    end
  end

  defmacro is_integer(term) do
    quote do
      Number.isInteger(unquote(term))
    end
  end

  defmacro is_list(term) do
    quote do
      Array.is_array(unquote(term))
    end
  end

  defmacro is_number(term) do
    quote do
      is_integer(unquote(term)) || is_float(unquote(term))
    end
  end

  defmacro is_pid(term) do
    quote do
      Elixir.Core.is_instance_of(unquote(term), Elixir.Core.PID);
    end
  end

  defmacro is_tuple(term) do
    quote do
      Elixir.Core.is_instance_of(unquote(term), Elixir.Core.Tuple);
    end
  end

  defmacro is_map(term) do
    quote do
      typeof(unquote(term)) === "object" || Elixir.Core.is_instance_of(unquote(term), Object);
    end
  end

  defmacro length(term) do
    quote do
      unquote(term).length
    end
  end

  defmacro map_size(term) do
    quote do
      Object.keys(unquote(term)).length
    end
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
    tuple.length
  end

  def not(arg) do
    !arg
  end

  def elem(tuple, index) do
    tuple.get(index)
  end

  defmacro is_nil(term) do
    quote do
      unquote(term) == nil
    end
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



end
