defmodule ElixirScript.Translator.Send.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "call send outside process" do
    ex_ast = quote do
      send(pid, "hello")
    end

    js_code = """
    Elixir.Core.processes.send(pid, 'hello')
    """

    assert_translation(ex_ast, js_code)
  end


  test "call send inside process" do
    ex_ast = quote do
      spawn(fn() ->
        inside = self()

        send(pid, "hello")
      end)
    end

    js_code = """
    Elixir.Core.processes.spawn(function*()    {
    let [inside] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.processes.pid());
    return yield* Elixir.Core.Functions.run(Elixir.Core.processes['send'],[pid, 'hello'], null);
    })
    """

    assert_translation(ex_ast, js_code)
  end
end
