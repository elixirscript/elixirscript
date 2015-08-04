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
        return (function() {
          if (Kernel.match__qmark__(Erlang.atom('ok'), message)) {
            return value;
          } else if (Kernel.match__qmark__(Erlang.atom('error'), message)) {
            return value;
          } else {
            return IO.puts('Unexpected message received');
          }
        }.call(this));;
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
        return (function() {
          if (Kernel.match__qmark__(Erlang.atom('ok'), message)) {
            return value;
          } else if (Kernel.match__qmark__(Erlang.atom('error'), message)) {
            return value;
          } else {
            return IO.puts('Unexpected message received');
          }
        }.call(this));;
      }, 5000, function(time) {
        return IO.puts('No message in 5 seconds');
      })
    """

    assert_translation(ex_ast, js_code)
  end
end