defmodule ElixirScript.Translator.Import.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate import with only" do
    ex_ast = quote do
      import US, only: [la: 1, al: 2]
    end

    js_code = """
    import { la, al } from 'us';
    """

    assert_translation(ex_ast, js_code)

  end

end
