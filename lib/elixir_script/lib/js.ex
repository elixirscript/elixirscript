defmodule ElixirScript.JS do
  @moduledoc """
  This module defines macros and functions which implement
  JavaScript functionality that may not translate easily to
  Elixir. For instance, creating a new object
  """

  @doc """
  Creates new JavaScript objects.

  ex:
    ElixirScript.JS.new User, ["first_name", "last_name"]
  """
  defmacro new(module, params)

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
  Creates a breakpoint for JavaScript debuggers to stop at
  """
  defmacro debugger()

  @doc """
  The current JavaScript context
  """
  defmacro this()

  @doc """
  Mutates an existing JavaScript object.
  ex:
    ElixirScript.JS.mutate elem, %{"width" => 100}
  """
  defmacro update(object, map)

  @doc """
  Mutates an existing JavaScript object.
  ex:
    ElixirScript.JS.mutate elem, "width", 100
  """
  defmacro update(object, key, value)
end
