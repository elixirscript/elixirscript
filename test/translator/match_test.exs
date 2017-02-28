defmodule ElixirScript.Translator.Match.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate simple match" do
    ex_ast = quote do: a = 1
    js_code = "let [a] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(), 1);"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let [a] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(), Symbol.for('atom'));"

    assert_translation(ex_ast, js_code)
  end

  test "translate tuple match" do
    ex_ast = quote do
      {a, b} = {1, 2}
    end
    js_code = """
    let [a, b] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
        values: [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()]
    }), new Bootstrap.Core.Tuple(1, 2));
    let _ref = new Bootstrap.Core.Tuple(a, b);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, _, c} = {1, 2, 3}
    js_code = """
    let [a, undefined, c] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
        values: [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.wildcard(), Bootstrap.Core.Patterns.variable()]
    }), new Bootstrap.Core.Tuple(1, 2, 3));
    let _ref = new Bootstrap.Core.Tuple(a, undefined, c);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      a = 1
       {^a, _, c} = {1, 2, 3}
    end
    js_code = """
    let [, undefined, c] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
        values: [Bootstrap.Core.Patterns.bound(a), Bootstrap.Core.Patterns.wildcard(), Bootstrap.Core.Patterns.variable()]
    }), new Bootstrap.Core.Tuple(1, 2, 3));
    let _ref = new Bootstrap.Core.Tuple(undefined, undefined, c);
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate bound match" do
    ex_ast = quote do
      a = 1
      ^a = 1
    end

    js_code = """
     let [] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.bound(a),1);
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate list match" do
    ex_ast = quote do: [a, b] = [1, 2]
    js_code = """
         let [a,b] = Bootstrap.Core.Patterns.match(Object.freeze([Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()]),Object.freeze([1, 2]));
         let _ref = Object.freeze([a, b]);
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate head/tail match" do
    ex_ast = quote do: [a | b] = [1, 2, 3, 4]
    js_code = """
    let [a,b] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.headTail(Bootstrap.Core.Patterns.variable(),Bootstrap.Core.Patterns.variable()),Object.freeze([1, 2, 3, 4]));
    let _ref = Object.freeze([a, b]);
    """

    assert_translation(ex_ast, js_code)
  end
end
