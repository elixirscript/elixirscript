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

    js_code = "Kernel.SpecialForms.atom('time')"

    assert_translation(ex_ast, js_code)
  end


  test "quote 2 element tuple" do
    ex_ast = quote do
        quote do: {1, 2}
    end

    js_code = "Kernel.SpecialForms.tuple(1, 2)"

    assert_translation(ex_ast, js_code)
  end


  test "quote 3 element tuple" do
    ex_ast = quote do
        quote do: {1, 2, 3}
    end

    js_code = "Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('{}'), Kernel.SpecialForms.list(), Kernel.SpecialForms.list(1, 2, 3))"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call" do
    ex_ast = quote do
        quote do: test(1)
    end

    js_code = "Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('test'), 
      Kernel.SpecialForms.list(Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('context'),Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('import'),Kernel.SpecialForms.atom('Elixir.ExUnit.Case'))), 
      Kernel.SpecialForms.list(1))"

    assert_translation(ex_ast, js_code)
  end


  test "quote function with variable" do
    ex_ast = quote do
        quote do: test(x)
    end

    js_code = "Kernel.SpecialForms.tuple(
      Kernel.SpecialForms.atom('test'),
      Kernel.SpecialForms.list(Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('context'),Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('import'),Kernel.SpecialForms.atom('Elixir.ExUnit.Case'))),
      Kernel.SpecialForms.list(Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('x'),Kernel.SpecialForms.list(),Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')))
    )"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call with unquote" do
    ex_ast = quote do
        quote do: test(unquote(x))
    end

    js_code = "Kernel.SpecialForms.tuple(
      Kernel.SpecialForms.atom('test'), 
      Kernel.SpecialForms.list(Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('context'),Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('import'),Kernel.SpecialForms.atom('Elixir.ExUnit.Case'))),
      Kernel.SpecialForms.list(x)
    )"

    assert_translation(ex_ast, js_code)
  end


  test "quote function call with unquote_slicing" do
    ex_ast = quote do
        quote do: sum(1, unquote_splicing(values), 5)
    end

    js_code = "Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('sum'), Kernel.SpecialForms.list(), Enum.concat(Kernel.SpecialForms.list(1), values, Kernel.SpecialForms.list(5)))"

    assert_translation(ex_ast, js_code)
  end

  test "bind_quoted" do
    ex_ast = quote do
      quote bind_quoted: [x: x] do
        x * x
      end
    end

    js_code = "Kernel.SpecialForms.tuple(
      Kernel.SpecialForms.atom('*'),
      Kernel.SpecialForms.list(Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('context'),Kernel.SpecialForms.atom('Elixir.ElixirScript.Translator.Quote.Test')),Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('import'),Kernel.SpecialForms.atom('Elixir.Kernel'))),
      Kernel.SpecialForms.list(x, x)
    )"

    assert_translation(ex_ast, js_code)    
  end
end