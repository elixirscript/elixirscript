defmodule ElixirScript.Test do
    @doc false
    defmacro __using__(_opts) do
      quote do
        import unquote(__MODULE__), only: [test: 2, test: 3]
        import ExUnit.Assertions

        def __elixir_script_test_module__(), do: true
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
      name = String.to_atom("__test_#{String.replace(message, " ", "_")}")

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

      test_script_path = Path.join([:code.priv_dir(:elixir_script), "index.js"])

      {out, _a} = System.cmd "node", [test_script_path] ++ js_files, into: IO.stream(:stdio, :line)

      # Delete directory at the end
      File.rm_rf!(output)

      :ok
    end
end
