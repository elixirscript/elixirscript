defmodule ElixirScript.Translator.Spawn.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "call spawn" do
    ex_ast = quote do
      spawn(fn() -> 1 end)
    end

    js_code = """
    Elixir.Core.Functions.get_global().processes.spawn(function*() { return 1; })
    """

    assert_translation(ex_ast, js_code)
  end

  test "call spawn with calls" do
    ex_ast = quote do
      spawn(fn() ->
        Window.call(1)
        Tuple.to_list({1, 2, 3})
      end)
    end

    js_code = """
    Elixir.Core.Functions.get_global().processes.spawn(function*()    {
        yield* Elixir.Core.Functions.run(Window['call'],[1])
        return yield* Elixir.Core.Functions.run(Elixir$ElixirScript$Tuple['to_list'],[new Elixir.Core.Tuple(1,2,3)]);
    })
    """

    assert_translation(ex_ast, js_code)
  end


  test "call spawn with function apply" do
    ex_ast = quote do
      spawn(Tuple, :to_list, [{1, 2, 3}])
    end

    js_code = """
    Elixir.Core.Functions.get_global().processes.spawn(Elixir.Core.Functions.run,[Elixir$ElixirScript$Tuple['to_list'], [new Elixir.Core.Tuple(1,2,3)]])
    """

    assert_translation(ex_ast, js_code)
  end


  test "call spawn with JS function" do
    ex_ast = quote do
      spawn(Window, :call, [{1, 2, 3}])
    end

    js_code = """
    Elixir.Core.Functions.get_global().processes.spawn(Elixir.Core.Functions.run,[Window['call'], [new Elixir.Core.Tuple(1,2,3)]])
    """

    assert_translation(ex_ast, js_code)
  end
end
