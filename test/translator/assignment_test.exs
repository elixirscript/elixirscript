defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate assignment" do
    ex_ast = quote do: a = 1
    js_code = "let a0 = 1;"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ^a = 1
    js_code = """ 
        if(!Kernel.match(a, 1))
          throw new MatchError('no match of right hand side value');
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let a0 = Atom('atom');"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, b} = {1, 2}
    js_code = """
        let _ref = Tuple(1, 2);
        let a0 = _ref[0];  
        let b0 = _ref[1];
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
        let _ref = Tuple(1, 2, 3);

        let a0 = _ref[0];  
        let undefined = _ref[1];  
        let c0 = _ref[2];
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
        let _ref = Tuple(1, 2, 3);

        if(!Kernel.match(a, _ref[0]))
          throw new MatchError('no match of right hand side value');

        let undefined = _ref[1];
        let c0 = _ref[2];
    """

    assert_translation(ex_ast, js_code)
  end
end