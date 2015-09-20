defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple assignment" do
    ex_ast = quote do: a = 1
    js_code = "let [a] = Patterns.match(Patterns.variable(), 1);"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let [a] = Patterns.match(Patterns.variable(), Kernel.SpecialForms.atom('atom'));"

    assert_translation(ex_ast, js_code)
  end

  should "translate tuple assignment" do
    ex_ast = quote do
      {a, b} = {1, 2}
    end
    js_code = """
        let [a, b] = Patterns.match(Kernel.SpecialForms.tuple(Patterns.variable(), Patterns.variable()), Kernel.SpecialForms.tuple(1, 2));
        let _ref = Kernel.SpecialForms.tuple(a, b);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
        let [a, undefined, c] = Patterns.match(Kernel.SpecialForms.tuple(Patterns.variable(), Patterns.wildcard(), Patterns.variable()), Kernel.SpecialForms.tuple(1, 2, 3));
        let _ref = Kernel.SpecialForms.tuple(a, undefined, c);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
         let [,undefined,c] = Patterns.match(Kernel.SpecialForms.tuple(fun.bound(a),Patterns.wildcard(),Patterns.variable()),Kernel.SpecialForms.tuple(1,2,3));
         let _ref = Kernel.SpecialForms.tuple(undefined,undefined,c);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate bound assignment" do
    ex_ast = quote do: ^a = 1
    js_code = """ 
        let [] = Patterns.match(fun.bound(a), 1);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate list assignment" do
    ex_ast = quote do: [a, b] = [1, 2]
    js_code = """
        let [a, b] = Patterns.match(Kernel.SpecialForms.list(Patterns.variable(), Patterns.variable()), Kernel.SpecialForms.list(1, 2));
        let _ref = Kernel.SpecialForms.list(a, b);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate head/tail assignment" do
    ex_ast = quote do: [a | b] = [1, 2, 3, 4]
    js_code = """
        let [a, b] = Patterns.match(fun.headTail, Kernel.SpecialForms.list(1, 2, 3, 4));
        let _ref = Kernel.SpecialForms.list(a, b);
    """

    assert_translation(ex_ast, js_code)
  end
end