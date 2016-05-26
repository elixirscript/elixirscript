defmodule ElixirScript.Translator.Match.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate simple assignment" do
    ex_ast = quote do: a = 1
    js_code = "let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), 1);"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), Symbol.for('atom'));"

    assert_translation(ex_ast, js_code)
  end

  test "translate tuple assignment" do
    ex_ast = quote do
      {a, b} = {1, 2}
    end
    js_code = """
    let [a, b] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
    }), new Elixir.Core.Tuple(1, 2));
    let _ref = new Elixir.Core.Tuple(a, b);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
    let [a, undefined, c] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()]
    }), new Elixir.Core.Tuple(1, 2, 3));
    let _ref = new Elixir.Core.Tuple(a, undefined, c);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do: {^a, _, c} = {1, 2, 3}
    js_code = """
    let [, undefined, c] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.bound(a), Elixir.Core.Patterns.wildcard(), Elixir.Core.Patterns.variable()]
    }), new Elixir.Core.Tuple(1, 2, 3));
    let _ref = new Elixir.Core.Tuple(undefined, undefined, c);
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate bound assignment" do
    ex_ast = quote do: ^a = 1
    js_code = """
     let [] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.bound(a),1);
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate list assignment" do
    ex_ast = quote do: [a, b] = [1, 2]
    js_code = """
         let [a,b] = Elixir.Core.Patterns.match(Object.freeze([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]),Object.freeze([1, 2]));
         let _ref = Object.freeze([a, b]);
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate head/tail assignment" do
    ex_ast = quote do: [a | b] = [1, 2, 3, 4]
    js_code = """
    let [a,b] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.headTail(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.variable()),Object.freeze([1, 2, 3, 4]));
    let _ref = Object.freeze([a, b]);
    """

    assert_translation(ex_ast, js_code)
  end
end
