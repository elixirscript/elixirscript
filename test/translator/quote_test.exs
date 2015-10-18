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

    js_code = "Elixir.Kernel.SpecialForms.atom('time')"

    assert_translation(ex_ast, js_code)
  end


  test "quote 2 element tuple" do
    ex_ast = quote do
        quote do: {1, 2}
    end

    js_code = "Elixir.Kernel.SpecialForms.tuple(1, 2)"

    assert_translation(ex_ast, js_code)
  end


  test "quote 3 element tuple" do
    ex_ast = quote do
        quote do: {1, 2, 3}
    end

    js_code = "Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('{}'), Elixir.Kernel.SpecialForms.list(), Elixir.Kernel.SpecialForms.list(1, 2, 3))"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call" do
    ex_ast = quote do
        quote do: test(1)
    end

    js_code = "Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('test'), 
      Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('context'),Elixir.Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('import'),Elixir.Kernel.SpecialForms.atom('Elixir.ExUnit.Case'))), 
      Elixir.Kernel.SpecialForms.list(1))"

    assert_translation(ex_ast, js_code)
  end


  test "quote function with variable" do
    ex_ast = quote do
        quote do: test(x)
    end

    js_code = "Elixir.Kernel.SpecialForms.tuple(
      Elixir.Kernel.SpecialForms.atom('test'),
      Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('context'),Elixir.Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('import'),Elixir.Kernel.SpecialForms.atom('Elixir.ExUnit.Case'))),
      Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('x'),Elixir.Kernel.SpecialForms.list(),Elixir.Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')))
    )"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call with unquote" do
    ex_ast = quote do
        quote do: test(unquote(x))
    end

    js_code = "Elixir.Kernel.SpecialForms.tuple(
      Elixir.Kernel.SpecialForms.atom('test'), 
      Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('context'),Elixir.Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('import'),Elixir.Kernel.SpecialForms.atom('Elixir.ExUnit.Case'))),
      Elixir.Kernel.SpecialForms.list(x)
    )"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call with unquote_slicing" do
    ex_ast = quote do
        quote do: sum(1, unquote_splicing(values), 5)
    end

    js_code = "Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('sum'), Elixir.Kernel.SpecialForms.list(), Elixir.Enum.concat(Elixir.Kernel.SpecialForms.list(1), values, Elixir.Kernel.SpecialForms.list(5)))"

    assert_translation(ex_ast, js_code)
  end

  test "bind_quoted" do
    ex_ast = quote do
      quote bind_quoted: [x: x] do
        x * x
      end
    end

    js_code = "Elixir.Kernel.SpecialForms.tuple(
      Elixir.Kernel.SpecialForms.atom('*'),
      Elixir.Kernel.SpecialForms.list(Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('context'),Elixir.Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.atom('import'),Elixir.Kernel.SpecialForms.atom('Elixir.Kernel'))),
      Elixir.Kernel.SpecialForms.list(x, x)
    )"

    assert_translation(ex_ast, js_code)    
  end
end