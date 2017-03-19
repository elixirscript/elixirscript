defmodule JS do
  @moduledoc """
  This module defines macros and functions which implement
  JavaScript functionality that may not translate easily to
  Elixir. For instance, creating a new object, or updating
  an existing one.
  """

  @doc """
  Creates new JavaScript objects.

  ex:
    JS.new User, ["first_name", "last_name"]
  """
  defmacro new(module, params)

  @doc """
  Updates an existing JavaScript object.

  ex:
    JS.update elem, %{"width" => 100}
  """
  defmacro update(object, map)

  @doc """
  Updates an existing JavaScript object.

  ex:
    JS.update elem, "width", 100
  """
  defmacro update(object, key, value)

  @doc """
  Returns the type of the given value
  """
  defmacro typeof(value)

  @doc """
  Determines if value is an instance of type.
  """
  defmacro instanceof(value, type)

  @doc """
  Throws the term given
  """
  defmacro throw(term)

  @doc """
  Returns a reference to the global JavaScript object.

  In browsers this would be window or self.
  In node this would be the global object.
  """
  def global() do
    Bootstrap.Core.Functions.get_global()
  end

  @doc """
  Defines a generator. This is compiled into a generator function in JavaScript.
  defgen and defgenp are currently the only ways to use process in Elixirscript right now.
  """
  defmacro defgen(call, expr \\ nil) do
    quote do
      def unquote(call), unquote(expr)
    end
  end

  @doc """
  Defines a private generator. This is compiled into a generator function in JavaScript.
  """
  defmacro defgenp(call, expr \\ nil) do
    quote do
      defp unquote(call), unquote(expr)
    end
  end

  @doc """
  Determines if term is a generator
  """
  def is_generator(term) do
    term.constructor.name === "GeneratorFunction"
  end

  @doc """
  Yields the current generator function
  """
  defmacro yield()

  @doc """
  Yields the current generator function with the given term
  """
  defmacro yield(term)

  @doc """
  Yields control to the given generator
  """
  defmacro yield_to(gen)

  @doc """
  Creates a breakpoint for JavaScript debuggers to stop at
  """
  defmacro debugger()

  @doc """
  The current JavaScript context
  """
  defmacro this()
end
