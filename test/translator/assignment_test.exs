defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate assignment" do
    ex_ast = quote do: a = 1
    js_code = "let a = 1;"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let a = Atom('atom');"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, b} = {1, 2}
    js_code = """
      {
        let _ref = Tuple(1, 2);
        let [a, b] = _ref.value;      
      }

    """

    assert_translation(ex_ast, js_code)
  end
end