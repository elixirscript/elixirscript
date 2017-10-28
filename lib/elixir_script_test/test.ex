defmodule ElixirScript.Test do
    @doc false
    defmacro __using__(_opts) do
      quote do
        import unquote(__MODULE__), only: [test: 2, test: 3, setup: 1, setup: 2, setup_all: 1, setup_all: 2]
        import ExUnit.Assertions

        def __elixir_script_test_module__(), do: true
      end
    end

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
        def unquote(name)(unquote(context)) do
          %{
            message: unquote(message),
            test: fn(context) -> unquote(contents) end
          }
        end
      end
    end

    @doc """
    Runs tests found in the given path. Accepts wildcards
    """
    def start(path, opts \\ %{}) do
      output = Path.join([System.tmp_dir!(), "elixirscript_tests"])
      File.mkdir_p!(output)

      ElixirScript.Compiler.compile(path, [output: output])

      js_files = output
      |> Path.expand
      |> Path.join("Elixir.*.js")
      |> Path.wildcard()

      exit_status = node_test_runner(js_files)

      # Delete directory at the end
      File.rm_rf!(output)

      case exit_status do
        0 ->
          :ok
        _ ->
          :error
      end
    end

    defp node_test_runner(js_files) do
      test_script_path = Path.join([:code.priv_dir(:elixir_script), "testrunner", "index.js"])
      {_, exit_status} = System.cmd "node", [test_script_path] ++ js_files, into: IO.stream(:stdio, :line)
      exit_status
    end
end
