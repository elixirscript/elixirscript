defmodule ElixirScript.Translator.Import.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate import without options" do
    ex_ast = quote do
      import Hello.World
    end

    js_code = """
    Kernel.SpecialForms.import(Hello.World, List(), this)
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate import with only" do
    ex_ast = quote do
      import US, only: [la: 1, al: 2]
    end

    js_code = """
    Kernel.SpecialForms.import(US, List(Tuple(Atom('only'), List(Tuple(Atom('la'), 1), Tuple(Atom('al'), 2)))), this)
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate import with except" do
    ex_ast = quote do
      import US, except: [la: 1, al: 2]
    end

    js_code = """
    Kernel.SpecialForms.import(US, List(Tuple(Atom('except'), List(Tuple(Atom('la'), 1), Tuple(Atom('al'), 2)))), this)
    """

    assert_translation(ex_ast, js_code)

  end

end