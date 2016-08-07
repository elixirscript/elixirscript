defmodule ElixirScript.Translator.Spawn.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "call spawn with function apply" do
    ex_ast = quote do
      spawn(Tuple, :to_list, [{1, 2, 3}])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.spawn(Elixir$ElixirScript$Tuple,Symbol.for('to_list'),Object.freeze([new Elixir.Core.Tuple(1,2,3)]))
    """

    assert_translation(ex_ast, js_code)
  end


  test "call spawn with JS function" do
    ex_ast = quote do
      spawn(Window, :call, [{1, 2, 3}])
    end

    js_code = """
    Elixir$ElixirScript$Kernel.spawn(Window,Symbol.for('call'),Object.freeze([new Elixir.Core.Tuple(1,2,3)]))
    """

    assert_translation(ex_ast, js_code)
  end

end
