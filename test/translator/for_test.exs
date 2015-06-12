defmodule ElixirScript.Translator.For.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple for" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], do: n * 2
    end

    js_code = """
     (function () {
         let _results = List();
         for (let n of List(1, 2, 3, 4).value()) {
             _results = List.append(_results, n * 2);
         }
         return _results;
     }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with string" do
    ex_ast = quote do
      for n <- "Opera", do: n
    end

    js_code = """
     (function () {
         let _results = List();
         for (let n of 'Opera') {
             _results = List.append(_results, n);
         }
         return _results;
     }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple generator for" do
    ex_ast = quote do
      for x <- [1, 2], y <- [2, 3], do: x*y
    end

    js_code = """
     (function () {
         let _results = List();
         for (let x of List(1, 2).value()) {
             for (let y of List(2, 3).value()) {
                 _results = List.append(_results, x * y);
             }
         }
         return _results;
     }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple generator for, assignment, and do block" do
    ex_ast = quote do
      r = for x <- [1, 2], y <- [2, 3] do 
        x*y
      end
    end

    js_code = """
     let r = (function () {
         let _results = List();
         for (let x of List(1, 2).value()) {
             for (let y of List(2, 3).value()) {
                 _results = List.append(_results, x * y);
             }
         }
         return _results;
     }.call(this));;
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with filter" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    end

    js_code = """
     (function () {
         let _results = List();
         for (let n of List(1, 2, 3, 4, 5, 6).value()) {
             if (Kernel.rem(n, 2) == 0)
                 _results = List.append(_results, n);
         }
         return _results;
     }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with pattern matched input" do
    ex_ast = quote do
      for {:user, name} <- [user: "john", admin: "john", user: "meg"] do
        String.upcase(name)
      end
    end

    js_code = """
     (function () {
         let _results = List();
         for (let _ref of List(Tuple(Atom('user'), 'john'), Tuple(Atom('admin'), 'john'), Tuple(Atom('user'), 'meg'))) {
             if (Kernel.match__qmark__(_ref, Tuple(Atom('user'), undefined))) {
                 let name = _ref.get(1);
                 _results = List.append(_results, String.upcase(name));
             }
         }
         return _results;
     }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end
end