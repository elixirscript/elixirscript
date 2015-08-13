defmodule ElixirScript.Translator.Receive.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate receive without after" do
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
      Kernel.SpecialForms.receive(function(message) {
        return fun([[Erlang.atom('ok')], function() {
          return value;
        }], [[Erlang.atom('error')], function() {
          return value;
        }], [[fun.wildcard], function() {
          return IO.puts('Unexpected message received');
        }]).call(message);
      })
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate receive with after" do
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
      Kernel.SpecialForms.receive(function(message) {
        return fun([[Erlang.atom('ok')], function() {
          return value;
        }], [[Erlang.atom('error')], function() {
          return value;
        }], [[fun.wildcard], function() {
          return IO.puts('Unexpected message received');
        }]).call(message);
      }, 
      5000, 
      fun([[5000], function() {
        return IO.puts('No message in 5 seconds');
      }]))
    """

    assert_translation(ex_ast, js_code)
  end
end