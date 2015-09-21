defmodule ElixirScript.Translator.Capture.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate capture operator with Module, function, and arity" do
    ex_ast = quote do
      fun = &Kernel.is_atom/1
    end

    js_code = """
     let [fun] = Patterns.match(Patterns.variable(),[[Patterns.variable()], function(__1)    {
             return     Kernel.is_atom(__1);
           }]);
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate capture operator with function, and parameters" do

    ex_ast = quote do
      fun = &is_atom(&1)
    end

    js_code = """
     let [fun] = Patterns.match(Patterns.variable(),Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(__1)    {
             return     Kernel.is_atom(__1);
           })));
    """

    assert_translation(ex_ast, js_code)


  end

  should "translate capture operator with function, and arity" do

    ex_ast = quote do
      fun = &local_function/1
    end

    js_code = """
     let [fun] = Patterns.match(Patterns.variable(),[[Patterns.variable()], function(__1)    {
             return     local_function(__1);
           }]);
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate capture operator with anonymous function" do  

    ex_ast = quote do
      fun = &(&1 * 2)
    end

    js_code = """
     let [fun] = Patterns.match(Patterns.variable(),Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(__1)    {
             return     __1 * 2;
           })));
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate capture operator with anonymous function tuple" do  

    ex_ast = quote do
      fun = &{&1, &2}
    end

    js_code = """
     let [fun] = Patterns.match(Patterns.variable(),Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(__1,__2)    {
             return     Kernel.SpecialForms.tuple(__1,__2);
           })));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      fun = &{&1, &2, &3}
    end

    js_code = """
     let [fun] = Patterns.match(Patterns.variable(),Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable(), Patterns.variable()],function(__1,__2,__3)    {
             return     Kernel.SpecialForms.tuple(__1,__2,__3);
           })));
    """

    assert_translation(ex_ast, js_code)


  end

  should "translate capture operator with anonymous functions as parameters" do  

    ex_ast = quote do
      Enum.map(items, &process(&1))
    end

    js_code = """
     Enum.map(items,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(__1)    {
             return     process(__1);
           })))
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      elem.keypress(&process_event(&1))
    end

    js_code = """
     elem.keypress(Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(__1)    {
             return     process_event(__1);
           })))
    """

    assert_translation(ex_ast, js_code)
  end
end