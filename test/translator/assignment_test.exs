defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple assignment" do
    ex_ast = quote do: a = 1
    js_code = "let [a] = Elixir.Patterns.match(Elixir.Patterns.variable(), 1);"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let [a] = Elixir.Patterns.match(Elixir.Patterns.variable(), Elixir.Kernel.SpecialForms.atom('atom'));"

    assert_translation(ex_ast, js_code)
  end

  should "translate tuple assignment" do
    ex_ast = quote do
      {a, b} = {1, 2}
    end
    js_code = """
        let [a, b] = Elixir.Patterns.match(Elixir.Kernel.SpecialForms.tuple(Elixir.Patterns.variable(), Elixir.Patterns.variable()), Elixir.Kernel.SpecialForms.tuple(1, 2));
        let _ref = Elixir.Kernel.SpecialForms.tuple(a, b);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
        let [a, undefined, c] = Elixir.Patterns.match(Elixir.Kernel.SpecialForms.tuple(Elixir.Patterns.variable(), Elixir.Patterns.wildcard(), Elixir.Patterns.variable()), Elixir.Kernel.SpecialForms.tuple(1, 2, 3));
        let _ref = Elixir.Kernel.SpecialForms.tuple(a, undefined, c);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
         let [,undefined,c] = Elixir.Patterns.match(Elixir.Kernel.SpecialForms.tuple(Elixir.Patterns.bound(a),Elixir.Patterns.wildcard(),Elixir.Patterns.variable()),Elixir.Kernel.SpecialForms.tuple(1,2,3));
         let _ref = Elixir.Kernel.SpecialForms.tuple(undefined,undefined,c);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate bound assignment" do
    ex_ast = quote do: ^a = 1
    js_code = """ 
     let [] = Elixir.Patterns.match(Elixir.Patterns.bound(a),1);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate list assignment" do
    ex_ast = quote do: [a, b] = [1, 2]
    js_code = """
        let [a, b] = Elixir.Patterns.match(Elixir.Kernel.SpecialForms.list(Elixir.Patterns.variable(), Elixir.Patterns.variable()), Elixir.Kernel.SpecialForms.list(1, 2));
        let _ref = Elixir.Kernel.SpecialForms.list(a, b);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate head/tail assignment" do
    ex_ast = quote do: [a | b] = [1, 2, 3, 4]
    js_code = """
         let [a,b] = Elixir.Patterns.match(Elixir.Patterns.headTail(),Elixir.Kernel.SpecialForms.list(1,2,3,4));
         let _ref = Elixir.Kernel.SpecialForms.list(a,b);
    """

    assert_translation(ex_ast, js_code)
  end
end