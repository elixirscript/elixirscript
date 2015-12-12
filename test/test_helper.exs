exclude = if Node.alive?, do: [], else: [skip: true]

ExUnit.start(exclude: exclude, formatters: [ShouldI.CLIFormatter])

defmodule ElixirScript.Math do
  defmacro squared(x) do
    quote do
      unquote(x) * unquote(x)
    end
  end
end

defmodule ElixirScript.Using do
  defmacro __using__(_) do
    quote do
      def sandwich() do
      end
    end
  end
end

defmodule ElixirScript.TestHelper do
  use ShouldI
  require Logger

  def make_custom_env do
    use ElixirScript
    require ElixirScript.Math
    require ElixirScript.Using
    __ENV__
  end

  def ex_ast_to_js(ex_ast) do
    ElixirScript.compile_quoted(ex_ast, [env: make_custom_env, import_standard_libs: false])
  end

  def strip_spaces(js) do
    js |> strip_new_lines |> String.replace(" ", "")
  end

  def strip_new_lines(js) do
    js |> String.replace("\n", "")
  end


  def assert_translation(ex_ast, js_code) do
    converted_code = ex_ast_to_js(ex_ast) |> Elixir.Enum.join("\n\n")

    assert converted_code |> strip_spaces == strip_spaces(js_code), """
    **Code Does Not Match **

    ***Expected***
    #{js_code}

    ***Actual***
    #{converted_code}
    """
  end

  def assert_js_matches(expected_js_code, actual_js_code) do
    assert strip_spaces(expected_js_code) == strip_spaces(actual_js_code), """
    **Code Does Not Match **

    ***Expected***
    #{expected_js_code}

    ***Actual***
    #{actual_js_code}
    """
  end
end
