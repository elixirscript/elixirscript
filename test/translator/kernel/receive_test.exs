
defmodule ElixirScript.Translator.Receive.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate receive without after in process" do
    ex_ast = quote do
        receive do
          :ok ->
            value
          :error ->
            value
          _ ->
            IO.puts "Unexpected message received"
        end

    end

    js_code = """
    Elixir.Core.processes.receive(function(message)    {
    return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Symbol.for('ok')],function()    {
    return     value;
    }),Elixir.Core.Patterns.clause([Symbol.for('error')],function()    {
    return     value;
    }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
    return     IO.puts('Unexpected message received');
    })).call(this,message);
    })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate receive with after in process" do
    ex_ast = quote do
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
    end

    js_code = """
    Elixir.Core.processes.receive(function(message)    {
    return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Symbol.for('ok')],function()    {
    return     value;
    }),Elixir.Core.Patterns.clause([Symbol.for('error')],function()    {
    return     value;
    }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
    return     IO.puts('Unexpected message received');
    })).call(this,message);
    },5000,Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([5000],function()    {
    return     IO.puts('No message in 5 seconds');
    })))
    """

    assert_translation(ex_ast, js_code)
  end
end
