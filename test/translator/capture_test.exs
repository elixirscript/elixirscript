defmodule ElixirScript.Translator.Capture.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate capture operator with Module, function, and arity" do
    ex_ast = quote do
      fun = &Elixir.Kernel.is_atom/1
    end

    js_code = """
     let [fun] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(__1)    {
             return     Elixir$ElixirScript$Kernel.is_atom(__1);
           })));
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate capture operator with function, and parameters" do

    ex_ast = quote do
      fun = &is_atom(&1)
    end

    js_code = """
     let [fun] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(__1)    {
             return     Elixir$ElixirScript$Kernel.is_atom(__1);
           })));
    """

    assert_translation(ex_ast, js_code)


  end

  test "translate capture operator with function, and arity" do

    ex_ast = quote do
      fun = &local_function/1
    end

    js_code = """
     let [fun] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(__1)    {
             return     local_function(__1);
           })));
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate capture operator with anonymous function" do

    ex_ast = quote do
      fun = &(&1 * 2)
    end

    js_code = """
     let [fun] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(__1)    {
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
     let [fun] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(__1,__2)    {
             return     new Elixir.Core.Tuple(__1,__2);
           })));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      fun = &{&1, &2, &3}
    end

    js_code = """
     let [fun] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(__1,__2,__3)    {
             return     new Elixir.Core.Tuple(__1,__2,__3);
           })));
    """

    assert_translation(ex_ast, js_code)


  end

  test "translate capture operator with anonymous functions as parameters" do

    ex_ast = quote do
      Elixir.Enum.map(items, &process(&1))
    end

    js_code = """
     Elixir.Enum.map(items,Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(__1)    {
             return     process(__1);
           })))
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      elem.keypress(&process_event(&1))
    end

    js_code = """
     elem.keypress(Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(__1)    {
             return     process_event(__1);
           })))
    """

    assert_translation(ex_ast, js_code)
  end
end
