defmodule ElixirScript.Translator.Assignment.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple assignment" do
    ex_ast = quote do: a = 1
    js_code = "let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), 1);"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), Symbol.for('atom'));"

    assert_translation(ex_ast, js_code)
  end

  should "translate tuple assignment" do
    ex_ast = quote do
      {a, b} = {1, 2}
    end
    js_code = """
    let [a, b] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
    }), Elixir.Core.Functions.new_tuple(1, 2));
    let _ref = Elixir.Core.Functions.new_tuple(a, b);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
    let [a, undefined, c] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()]
    }), Elixir.Core.Functions.new_tuple(1, 2, 3));
    let _ref = Elixir.Core.Functions.new_tuple(a, undefined, c);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
    let [, undefined, c] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.bound(a), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()]
    }), Elixir.Core.Functions.new_tuple(1, 2, 3));
    let _ref = Elixir.Core.Functions.new_tuple(undefined, undefined, c);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate bound assignment" do
    ex_ast = quote do: ^a = 1
    js_code = """
     let [] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.bound(a),1);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate list assignment" do
    ex_ast = quote do: [a, b] = [1, 2]
    js_code = """
        let [a, b] = Elixir.Core.Patterns.match(Elixir.Core.List(Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()), Elixir.Core.List(1, 2));
        let _ref = Elixir.Core.List(a, b);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate head/tail assignment" do
    ex_ast = quote do: [a | b] = [1, 2, 3, 4]
    js_code = """
         let [a,b] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.headTail(),Elixir.Core.List(1,2,3,4));
         let _ref = Elixir.Core.List(a,b);
    """

    assert_translation(ex_ast, js_code)
  end
end
