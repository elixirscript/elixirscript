defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple assignment" do
    ex_ast = quote do: a = 1
    js_code = "let [a] = fun.bind(fun.parameter, 1);"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let [a] = fun.bind(fun.parameter, Erlang.atom('atom'));"

    assert_translation(ex_ast, js_code)
  end

  should "translate tuple assignment" do
    ex_ast = quote do: {a, b} = {1, 2}
    js_code = """
        let [a, b] = fun.bind(Erlang.tuple(fun.parameter, fun.parameter), Erlang.tuple(1, 2));
        let _ref = Erlang.tuple(a, b);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
        let [a, undefined, c] = fun.bind(Erlang.tuple(fun.parameter, fun.wildcard, fun.parameter), Erlang.tuple(1, 2, 3));
        let _ref = Erlang.tuple(a, undefined, c);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
         let [,undefined,c] = fun.bind(Erlang.tuple(fun.bound(a),fun.wildcard,fun.parameter),Erlang.tuple(1,2,3));
         let _ref = Erlang.tuple(undefined,undefined,c);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate bound assignment" do
    ex_ast = quote do: ^a = 1
    js_code = """ 
        let [] = fun.bind(fun.bound(a), 1);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate list assignment" do
    ex_ast = quote do: [a, b] = [1, 2]
    js_code = """
        let [a, b] = fun.bind(Erlang.list(fun.parameter, fun.parameter), Erlang.list(1, 2));
        let _ref = Erlang.list(a, b);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate head/tail assignment" do
    ex_ast = quote do: [a | b] = [1, 2, 3, 4]
    js_code = """
        let [a, b] = fun.bind(fun.headTail, Erlang.list(1, 2, 3, 4));
        let _ref = Erlang.list(a, b);
    """

    assert_translation(ex_ast, js_code)
  end
end