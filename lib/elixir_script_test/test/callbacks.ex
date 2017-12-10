defmodule ElixirScript.Test.Callbacks do
  @moduledoc """
  Defines ElixirScript.Test callbacks
  """

  @doc """
  Called before all tests are run in a test file
  """
  defmacro setup_all(context \\ quote(do: _), contents) do
    do_setup(context, contents, :__elixirscript_test_setup_all)
  end

  @doc """
  Called before each test is run in a test file
  """
  defmacro setup(context \\ quote(do: _), contents) do
    do_setup(context, contents, :__elixirscript_test_setup)
  end

  defp do_setup(context, contents, name) do
    contents =
    case contents do
      [do: block] ->
        quote do
          unquote(block)
        end
      _ ->
        quote do
          try(unquote(contents))
        end
    end

    context = Macro.escape(context)
    contents = Macro.escape(contents, unquote: true)

    quote bind_quoted: [context: context, contents: contents, name: name] do
      def unquote(name)(unquote(context)) do
        unquote(contents)
      end
    end
  end

  @doc """
  Called after all tests are run in a test file
  """
  defmacro teardown_all(context \\ quote(do: _), contents) do
    do_teardown(context, contents, :__elixirscript_test_teardown_all)
  end

  @doc """
  Called after each test is run in a test file
  """
  defmacro teardown(context \\ quote(do: _), contents) do
    do_teardown(context, contents, :__elixirscript_test_teardown)
  end

  defp do_teardown(context, contents, name) do
    contents =
    case contents do
      [do: block] ->
        quote do
          unquote(block)
          :ok
        end
      _ ->
        quote do
          try(unquote(contents))
          :ok
        end
    end

    context = Macro.escape(context)
    contents = Macro.escape(contents, unquote: true)

    quote bind_quoted: [context: context, contents: contents, name: name] do
      def unquote(name)(unquote(context)) do
        unquote(contents)
      end
    end
  end

  @doc """
  Defines a test
  """
  defmacro test(message, context \\ quote(do: _), contents) do
    contents =
      case contents do
        [do: block] ->
          quote do
            unquote(block)
            :ok
          end
        _ ->
          quote do
            try(unquote(contents))
            :ok
          end
      end

    context = Macro.escape(context)
    contents = Macro.escape(contents, unquote: true)
    name = message
    |> String.replace(" ", "_")
    |> String.replace(~r/[^A-Za-z0-9]/, "")

    name = String.to_atom("__elixirscript_test_case_#{name}")

    quote bind_quoted: [context: context, contents: contents, message: message, name: name] do
      def unquote(name)() do
        %{
          message: unquote(message),
          test: fn(context) -> unquote(contents) end
        }
      end
    end
  end

  defmacro assert(assertion) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      require ExUnit.Assertions
      try do
        ExUnit.Assertions.assert(unquote(assertion))
      rescue
        x in [ExUnit.AssertionError] ->
          reraise(ElixirScript.Test.AssertionError, [
            left: x.left,
            right: x.right,
            message: x.message,
            expr: x.expr,
            file: unquote(file),
            line: unquote(line)
          ], [])
      end
    end
  end

  defmacro assert(value, message) do
    %{file: file, line: line} = __CALLER__

    quote [file: file, line: line] do
      require ExUnit.Assertions
      try do
        ExUnit.Assertions.assert(unquote(value), unquote(message))
      rescue
        x in [ExUnit.AssertionError] ->
          reraise(ElixirScript.Test.AssertionError, [
            left: x.left,
            right: x.right,
            message: x.message,
            expr: x.expr,
            file: unquote(file),
            line: unquote(line)
          ], [])
      end
    end
  end
end
