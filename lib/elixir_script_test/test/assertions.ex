defmodule ElixirScript.Test.Assertions do
  @moduledoc """
  Defines assertions for use in ElixirScript test.
  These are a subset of [ExUnit.Assertions](https://hexdocs.pm/ex_unit/ExUnit.Assertions.html)
  """

  @doc false
  def raise_elixir_script_assert(error, file, line) do
    reraise(ElixirScript.Test.AssertionError, [
      left: error.left,
      right: error.right,
      message: error.message,
      expr: error.expr,
      file: file,
      line: line
    ], [])
  end

  @doc """
  Asserts its argument is a truthy value
  """
  defmacro assert(assertion) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      try do
        ExUnit.Assertions.assert(unquote(assertion))
      rescue
        error in [ExUnit.AssertionError] ->
          ElixirScript.Test.Assertions.raise_elixir_script_assert(
            error,
            unquote(file),
            unquote(line)
          )
      end
    end
  end

  @doc """
  Asserts `value` is `true`, displaying the given `message` otherwise.
  """
  defmacro assert(value, message) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      try do
        ExUnit.Assertions.assert(unquote(value), unquote(message))
      rescue
        error in [ExUnit.AssertionError] ->
          ElixirScript.Test.Assertions.raise_elixir_script_assert(
            error,
            unquote(file),
            unquote(line)
          )
      end
    end
  end

  @doc """
  Asserts the `exception` is raised during `function` execution.
  Returns the rescued exception, fails otherwise.
  """
  defmacro assert_raise(exception, function) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      try do
        ExUnit.Assertions.assert(unquote(exception), unquote(function))
      rescue
        error in [ExUnit.AssertionError] ->
          ElixirScript.Test.Assertions.raise_elixir_script_assert(
            error,
            unquote(file),
            unquote(line)
          )
      end
    end
  end

  @doc """
  Asserts the `exception` is raised during `function` execution with
  the expected `message`, which can be a `Regex` or an exact `String`.
  Returns the rescued exception, fails otherwise.
  """
  defmacro assert_raise(exception, message, function) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      try do
        ExUnit.Assertions.assert(
          unquote(exception),
          unquote(message),
          unquote(function)
        )
      rescue
        error in [ExUnit.AssertionError] ->
          ElixirScript.Test.Assertions.raise_elixir_script_assert(
            error,
            unquote(file),
            unquote(line)
          )
      end
    end
  end

  @doc """
  A negative assertion, expects the expression to be `false` or `nil`.
  """
  defmacro refute(assertion) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      try do
        ExUnit.Assertions.assert(unquote(assertion))
      rescue
        error in [ExUnit.AssertionError] ->
          ElixirScript.Test.Assertions.raise_elixir_script_assert(
            error,
            unquote(file),
            unquote(line)
          )
      end
    end
  end

  @doc """
  Asserts `value` is `nil` or `false` (that is, `value` is not truthy).
  """
  defmacro refute(value, message) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      try do
        ExUnit.Assertions.assert(unquote(value), unquote(message))
      rescue
        error in [ExUnit.AssertionError] ->
          ElixirScript.Test.Assertions.raise_elixir_script_assert(
            error,
            unquote(file),
            unquote(line)
          )
      end
    end
  end

  @doc """
  Fails with a message.
  """
  defmacro flunk(message \\ "Flunked!") do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      try do
        ExUnit.Assertions.flunk(unquote(message))
      rescue
        error in [ExUnit.AssertionError] ->
          ElixirScript.Test.Assertions.raise_elixir_script_assert(
            error,
            unquote(file),
            unquote(line)
          )
      end
    end
  end
end
