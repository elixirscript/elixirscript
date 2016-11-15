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
  defmacro new(module, params) do
  end


  @doc """
  Updates an existing JavaScript object.

  ex:
    JS.update elem, %{"width" => 100}
  """
  defmacro update(object, map) do
  end


  @doc """
  Imports a JavaScript module.

  Elixir modules can use the normal `import`, `alias` and `require`,
  but JavaScript modules work differently and have to be imported
  using this.

  If `default` is set to true then it is treated as a default import.
  Otherwise it is treated as a namespace import.

  ex:
    JS.import A, "a" #translates to "import A from 'a'"

    JS.import A, "a", default: false #translates to "import * as A from 'a'"
  """
  defmacro import(module, from, opts \\ [default: true]) do
  end

  @doc """
  Returns the type of the given value
  """
  defmacro typeof(value) do
  end

  @doc """
  Determines if value is an instance of type.
  """
  defmacro instanceof(value, type) do
  end

  @doc """
  Throws the term given
  """
  defmacro throw(term) do
  end


  @doc """
  Returns a reference to the global JavaScript object.

  In browsers this would be window or self.
  In node this would be the global object.
  """
  def global() do
    Elixir.Core.Functions.get_global()
  end

  defmacro defgen(call, expr \\ nil) do
  end

  defmacro defgenp(call, expr \\ nil) do
  end

  def is_generator(term) do
    term.constructor.name === "GeneratorFunction"
  end

  defmacro yield() do
  end

  defmacro yield(term) do
  end

  defmacro yield_to(term) do
  end

  @doc """
  Provides a convenient way to create a string-based map.

  Elixirscript, by default turns the following, `%{a: "b"}` into `{[Symbol.for("a")]: "b"}` in JavaScript. In order to get string keys,
  one would have to do `%{"a" => "b"}` which turns into `{a: "b"}` in JavaScript. With `Kernel.object`, you can create string keyed maps
  conveniently, `object(a: "b")` which turns into `{a: "b"}`
  """
  defmacro object(args) do
  end
end
