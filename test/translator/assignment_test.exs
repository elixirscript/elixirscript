defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate assignment" do
    ex_ast = quote do: a = 1
    js_code = "let a = 1;"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ^a = 1
    js_code = """ 
        if(!Kernel.match__qmark__(a, 1))
          throw new MatchError('no match of right hand side value');
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let a = Erlang.atom('atom');"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, b} = {1, 2}
    js_code = """
        let [a, b] = Erlang.tuple_iterator(Erlang.tuple(1, 2));
        let _ref = Erlang.tuple(a,b);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
        let [a, undefined, c] = Erlang.tuple_iterator(Erlang.tuple(1, 2, 3));
        let _ref = Erlang.tuple(a,undefined,c);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
     let _ref = Erlang.tuple(1, 2, 3);
     if (!Kernel.match__qmark__(a, _ref.get(0)))
         throw new MatchError('no match of right hand side value');

     let undefined = Kernel.elem(_ref, 1);
     let c = Kernel.elem(_ref, 2);
    """

    assert_translation(ex_ast, js_code)
  end
end