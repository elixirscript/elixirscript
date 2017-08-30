defmodule ElixirScript.JS do
  @moduledoc """
  This module defines macros and functions which implement
  JavaScript functionality that may not translate easily to
  Elixir. For instance, creating a new object
  """

  use ElixirScript.FFI, global: true

  @doc """
  Creates new JavaScript objects.

  ```elixir
  ElixirScript.JS.new User, ["first_name", "last_name"]
  ```
  """
  defexternal new(module, params)

  @doc """
  Returns the type of the given value
  """
  defexternal typeof(value)

  @doc """
  Determines if value is an instance of type.
  """
  defexternal instanceof(value, type)

  @doc """
  Throws the term given
  """
  defexternal throw(term)

  @doc """
  Creates a breakpoint for JavaScript debuggers to stop at
  """
  defexternal debugger()

  @doc """
  The current JavaScript context
  """
  defexternal this()

  @doc """
  Mutates an existing JavaScript object.

  ```elixir
  ElixirScript.JS.mutate elem, "width", 100
  ```
  """
  defexternal mutate(object, key, value)

  @doc """
  Takes the given map and returns an object
  Throws an error if any key is not a
  number, binary, or atom


  ```elixir
  ElixirScript.JS.map_to_object(%{my: "map"})
  ```
  """
  defexternal map_to_object(object)

  @doc """
  Takes the given map and returns an object
  Throws an error if any key is not a
  number, binary, or atom

  ```elixir
  ElixirScript.JS.map_to_object(%{my: "map"}, keys: :string)
  ```
  """
  defexternal map_to_object(object, options)
end
