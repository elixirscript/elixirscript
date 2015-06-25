defmodule ElixirScript.Translator.Alias.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate alias without as" do
    ex_ast = quote do
        alias Hello.World
    end

    js_code = """
      Kernel.SpecialForms.alias(Hello.World, List(), this)
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate alias with as" do
    ex_ast = quote do
      alias Hello.World, as: Test
    end

    js_code = """
    Kernel.SpecialForms.alias(Hello.World, List(Tuple(Atom('as'), Atom('Test'))), this)
    """

    assert_translation(ex_ast, js_code)
  end


end