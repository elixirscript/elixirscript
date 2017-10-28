defmodule ElixirScript.Test.Callbacks do

  defmacro setup_all(context \\ quote(do: _), contents) do
    do_setup(context, contents, :__elixirscript_test_setup_all)
  end

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

  defmacro teardown_all(context \\ quote(do: _), contents) do
    do_teardown(context, contents, :__elixirscript_test_teardown_all)
  end

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
end
