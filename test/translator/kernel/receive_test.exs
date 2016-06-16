
defmodule ElixirScript.Translator.Receive.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate receive without after in process" do
    ex_ast = quote do
      spawn(fn() ->
        receive do
          :ok ->
            value
          :error ->
            value
          _ ->
            IO.puts "Unexpected message received"
        end
      end)

    end

    js_code = """
    Elixir.Core.Functions.get_global().processes.spawn(function*()    {
    return     yield Elixir.Core.Functions.get_global().processes.receive(function(message)    {
    return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Symbol.for('ok')],function()    {
    return     value;
    }),Elixir.Core.Patterns.make_case([Symbol.for('error')],function()    {
    return     value;
    }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
    return     yield* Elixir.Core.Functions.run(IO['puts'],['Unexpected message received'],null);
    })).call(this,message);
    });
    })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate receive with after in process" do
    ex_ast = quote do

      spawn(fn() ->
        receive do
          :ok ->
            value
          :error ->
            value
          _ ->
            IO.puts "Unexpected message received"
        after
          5000 ->
            IO.puts "No message in 5 seconds"
        end
      end)
    end

    js_code = """
    Elixir.Core.Functions.get_global().processes.spawn(function*()    {
    return     yield Elixir.Core.Functions.get_global().processes.receive(function(message)    {
    return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Symbol.for('ok')],function()    {
    return     value;
    }),Elixir.Core.Patterns.make_case([Symbol.for('error')],function()    {
    return     value;
    }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
    return     yield* Elixir.Core.Functions.run(IO['puts'],['Unexpected message received'],null);
    })).call(this,message);
    },5000,Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([5000],function()    {
    return     yield* Elixir.Core.Functions.run(IO['puts'],['No message in 5 seconds'],null);
    })));
    })
    """

    assert_translation(ex_ast, js_code)
  end
end
