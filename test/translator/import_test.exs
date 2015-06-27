defmodule ElixirScript.Translator.Import.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate import without options" do
    ex_ast = quote do
      import Hello.World
    end

    js_code = """
    Kernel.SpecialForms.import(Hello.World, Erlang.list(), this)
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate import with only" do
    ex_ast = quote do
      import US, only: [la: 1, al: 2]
    end

    js_code = """
    Kernel.SpecialForms.import(US, Erlang.list(Erlang.tuple(Erlang.atom('only'), Erlang.list(Erlang.tuple(Erlang.atom('la'), 1), Erlang.tuple(Erlang.atom('al'), 2)))), this)
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate import with except" do
    ex_ast = quote do
      import US, except: [la: 1, al: 2]
    end

    js_code = """
    Kernel.SpecialForms.import(US, Erlang.list(Erlang.tuple(Erlang.atom('except'), Erlang.list(Erlang.tuple(Erlang.atom('la'), 1), Erlang.tuple(Erlang.atom('al'), 2)))), this)
    """

    assert_translation(ex_ast, js_code)

  end

end