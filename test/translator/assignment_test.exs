defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate assignment" do
    ex_ast = quote do: a = 1
    js_code = "var a = 1;"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ^a = 1
    js_code = """ 
        if(!Kernel.match(a, 1))
          throw new MatchError('no match of right hand side value');
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "var a = Atom('atom');"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, b} = {1, 2}
    js_code = """
        var _ref = Tuple(1, 2);
        var a = _ref[0];  
        var b = _ref[1];
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
        var _ref = Tuple(1, 2, 3);

        var a = _ref[0];  
        var undefined = _ref[1];  
        var c = _ref[2];
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
        var _ref = Tuple(1, 2, 3);

        if(!Kernel.match(a, _ref[0]))
          throw new MatchError('no match of right hand side value');

        var undefined = _ref[1];
        var c = _ref[2];
    """

    assert_translation(ex_ast, js_code)
  end
end