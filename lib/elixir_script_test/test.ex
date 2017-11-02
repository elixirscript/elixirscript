defmodule ElixirScript.Test do
  @moduledoc """
  Unit Testing Framework for ElixirScript.

  Requires node.js 8.3.0 and above

  Uses assertions from ExUnit as well as has a similar api to ExUnit with a few differences

  ## Example

  An basic setup of a test. Modified from ExUnit's example

  ```elixir
    # File: assertion_test.exs
    # 1) Create a new test module (test case) and use "ElixirScript.Test".
    defmodule AssertionTest do
      use ElixirScript.Test

      # 2) Use the "test" macro.
      test "the truth" do
        assert true
      end
    end
  ```

  To run the test above, use the `ElixirScript.Test.start/1` function, giving it the path to the test
  ```
  ElixirScript.Test.start("assertion_test.exs")
  ```

  ## Integration with Mix

  To run tests using mix, run `mix elixirscript.test`. This will run all tests in the test_elixir_script directory.


  ## Callbacks

  ElixirScript defines the following callbacks

  * setup/1
  * setup/2
  * setup_all/1
  * setup_all/2
  * teardown/1
  * teardown/2
  * teardown_all/1
  * teardown_all/2

  The `setup` and `setup_all` callbacks work exactly as they would in ExUnit. Instead of having an `on_exit` callback,
  ElixirScript.Test has `teardown` callbacks. `teardown` is called after each test and `teardown_all` after all tests
  in the file have run.

  ```elixir
    defmodule AssertionTest do
      use ElixirScript.Test

      # run before test
      setup do
        admin = create_admin_function()
        [admin: admin]
      end

      test "the truth", %{admin: admin} do
        assert admin.is_authenticated
      end

      # run after test
      teardown, %{admin: admin} do
        destroy_admin_function(admin)
      end
    end
  ```
  """

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

      def __elixirscript_test_module__, do: true
    end
  end

  @doc """
  Runs tests found in the given path. Accepts wildcards
  """
  @spec start(binary(), map()) :: :ok | :error
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
    test_script_path = [test_script_path] ++ js_files
    {_, exit_status} = System.cmd(
      "node",
      test_script_path,
      into: IO.stream(:stdio, :line)
    )

    exit_status
  end
end
