defmodule ElixirScript.Translator.Quote.Test do
  use ShouldI
  import ElixirScript.TestHelper

  test "quote number" do
    ex_ast = quote do
        quote do: 1
    end

    js_code = "1"

    assert_translation(ex_ast, js_code)
  end

  test "quote atom" do
    ex_ast = quote do
        quote do: :time
    end

    js_code = "Erlang.atom('time')"

    assert_translation(ex_ast, js_code)
  end


  test "quote 2 element tuple" do
    ex_ast = quote do
        quote do: {1, 2}
    end

    js_code = "Erlang.tuple(1, 2)"

    assert_translation(ex_ast, js_code)
  end


  test "quote 3 element tuple" do
    ex_ast = quote do
        quote do: {1, 2, 3}
    end

    js_code = "Erlang.tuple(Erlang.atom('{}'), Erlang.list(), Erlang.list(1, 2, 3))"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call" do
    ex_ast = quote do
        quote do: test(1)
    end

    js_code = "Erlang.tuple(Erlang.atom('test'), 
      Erlang.list(Erlang.tuple(Erlang.atom('context'),Erlang.atom('Elixir.ElixirScript.Translator.Quote.Test')),Erlang.tuple(Erlang.atom('import'),Erlang.atom('Elixir.ExUnit.Case'))), 
      Erlang.list(1))"

    assert_translation(ex_ast, js_code)
  end


  test "quote function with variable" do
    ex_ast = quote do
        quote do: test(x)
    end

    js_code = "Erlang.tuple(
      Erlang.atom('test'),
      Erlang.list(Erlang.tuple(Erlang.atom('context'),Erlang.atom('Elixir.ElixirScript.Translator.Quote.Test')),Erlang.tuple(Erlang.atom('import'),Erlang.atom('Elixir.ExUnit.Case'))),
      Erlang.list(Erlang.tuple(Erlang.atom('x'),Erlang.list(),Erlang.atom('Elixir.ElixirScript.Translator.Quote.Test')))
    )"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call with unquote" do
    ex_ast = quote do
        quote do: test(unquote(x))
    end

    js_code = "Erlang.tuple(
      Erlang.atom('test'), 
      Erlang.list(Erlang.tuple(Erlang.atom('context'),Erlang.atom('Elixir.ElixirScript.Translator.Quote.Test')),Erlang.tuple(Erlang.atom('import'),Erlang.atom('Elixir.ExUnit.Case'))),
      Erlang.list(x)
    )"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call with unquote_slicing" do
    ex_ast = quote do
        quote do: sum(1, unquote_splicing(values), 5)
    end

    js_code = "Erlang.tuple(Erlang.atom('sum'), Erlang.list(), Enum.concat(Erlang.list(1), values, Erlang.list(5)))"

    assert_translation(ex_ast, js_code)
  end

  test "bind_quoted" do
    ex_ast = quote do
      quote bind_quoted: [x: x] do
        x * x
      end
    end

    js_code = "Erlang.tuple(
      Erlang.atom('*'),
      Erlang.list(Erlang.tuple(Erlang.atom('context'),Erlang.atom('Elixir.ElixirScript.Translator.Quote.Test')),Erlang.tuple(Erlang.atom('import'),Erlang.atom('Elixir.Kernel'))),
      Erlang.list(x, x)
    )"

    assert_translation(ex_ast, js_code)    
  end
end