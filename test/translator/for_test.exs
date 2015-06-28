defmodule ElixirScript.Translator.For.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple for" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], do: n * 2
    end

    js_code = """
     (function () {
         let _results = Erlang.list();
         for (let n of Erlang.list(1, 2, 3, 4)) {
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
         let _results = Erlang.list();
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
         let _results = Erlang.list();
         for (let x of Erlang.list(1, 2)) {
             for (let y of Erlang.list(2, 3)) {
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
         let _results = Erlang.list();
         for (let x of Erlang.list(1, 2)) {
             for (let y of Erlang.list(2, 3)) {
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
         let _results = Erlang.list();
         for (let n of Erlang.list(1, 2, 3, 4, 5, 6)) {
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
         let _results = Erlang.list();
         for (let _ref of Erlang.list(Erlang.tuple(Erlang.atom('user'), 'john'), Erlang.tuple(Erlang.atom('admin'), 'john'), Erlang.tuple(Erlang.atom('user'), 'meg'))) {
             if (Kernel.match__qmark__(_ref, Erlang.tuple(Erlang.atom('user'), undefined))) {
                 let name = Kernel.elem(_ref, 1);
                 _results = List.append(_results, String.upcase(name));
             }
         }
         return _results;
     }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end
end