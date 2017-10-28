defmodule ElixirScript.Test do
    @doc false
    defmacro __using__(_opts) do
      quote do
        import ElixirScript.Test.Callbacks, only: [
                                            test: 2, test: 3,
                                            setup: 1, setup: 2,
                                            setup_all: 1, setup_all: 2,
                                            teardown: 1, teardown: 2,
                                            teardown_all: 1, teardown_all: 2
                                          ]
        import ExUnit.Assertions

        def __elixirscript_test_module__(), do: true
      end
    end

    @doc """
    Runs tests found in the given path. Accepts wildcards
    """
    def start(path, _opts \\ %{}) do
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
