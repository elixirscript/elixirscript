defmodule ElixirScript.Translator.Capture.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate capture operator with Module, function, and arity" do
    ex_ast = quote do
      fun = &Elixir.Kernel.is_atom/1
    end

    js_code = """
    let [fun] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(), Elixir.ElixirScript.Kernel.__load(Elixir).is_atom);
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate capture operator with function, and parameters" do

    ex_ast = quote do
      fun = &is_atom(&1)
    end

    js_code = """
     let [fun] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(__1)    {
             return Elixir.ElixirScript.Kernel.__load(Elixir).is_atom(__1);
           })));
    """

    assert_translation(ex_ast, js_code)


  end

  test "translate capture operator with function, and arity" do

    ex_ast = quote do
      fun = &is_atom/1
    end

    js_code = """
    let [fun] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),is_atom);
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate capture operator with anonymous function" do

    ex_ast = quote do
      fun = &(&1 * 2)
    end

    js_code = """
     let [fun] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(__1)    {
             return     __1 * 2;
           })));
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate capture operator with anonymous function tuple" do

    ex_ast = quote do
      fun = &{&1, &2}
    end

    js_code = """
     let [fun] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()],function(__1,__2)    {
             return     new Bootstrap.Core.Tuple(__1,__2);
           })));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      fun = &{&1, &2, &3}
    end

    js_code = """
     let [fun] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()],function(__1,__2,__3)    {
             return     new Bootstrap.Core.Tuple(__1,__2,__3);
           })));
    """

    assert_translation(ex_ast, js_code)


  end

  test "translate capture operator with anonymous functions as parameters" do

    ex_ast = quote do
      def process(a) do
      end

      def execute() do
        Enum.map([], &process(&1))
      end
    end

    js_code = """
     Elixir.ElixirScript.Enum.__load(Elixir).map(Object.freeze([]),Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(__1)    {
             return     process(__1);
           })))
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      def process_event(a) do
      end

      def execute() do
        Elem.keypress(&process_event(&1))
      end
    end

    js_code = """
     Elem.keypress(Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(__1)    {
             return     process_event(__1);
           })))
    """

    assert_translation(ex_ast, js_code)
  end
end
