defmodule ElixirScript.Translator.Try.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate with a rescue with one match" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('ArgumentError')
       }],function()    {
             return     IO.puts('Invalid argument given');
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate with a rescue with a list match" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        [ArgumentError] ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('ArgumentError')
       }],function()    {
             return     IO.puts('Invalid argument given');
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate with a rescue with an in guard" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        x in [ArgumentError] ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
             return     IO.puts('Invalid argument given');
           },function(x)    {
             return     Kernel.__in__(x,Kernel.SpecialForms.list(ArgumentError.defstruct()));
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate with a rescue with an identifier" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        x ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
             return     IO.puts('Invalid argument given');
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end


  should "translate with a rescue with multiple patterns" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        [ArgumentError] ->
          IO.puts "ArgumentError"
        x ->
          IO.puts "x"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('ArgumentError')
       }],function()    {
             return     IO.puts('ArgumentError');
           }),Patterns.make_case([Patterns.variable()],function(x)    {
             return     IO.puts('x');
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate with a rescue and after clause" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      after
        IO.puts "This is printed regardless if it failed or succeed"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('ArgumentError')
       }],function()    {
             return     IO.puts('Invalid argument given');
           })),null,null,function()    {
             return     IO.puts('This is printed regardless if it failed or succeed');
           })
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate with an after clause" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      after
        IO.puts "This is printed regardless if it failed or succeed"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },null,null,null,function()    {
             return     IO.puts('This is printed regardless if it failed or succeed');
           })
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate else" do
    ex_ast = quote do
      try do
        1 / x
      else
        y when y < 1 and y > -1 ->
          :small
        _ ->
          :large
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     1 / x;
           },null,null,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(y)    {
             return     Kernel.SpecialForms.atom('small');
           },function(y)    {
             return     (y < 1) && (y > -1);
           }),Patterns.make_case([Patterns.wildcard()],function()    {
             return     Kernel.SpecialForms.atom('large');
           })),null)
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate catch" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      catch
        :throw, :Error ->
          IO.puts "caught error"
      end
    end

    js_code = """
     Kernel.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('ArgumentError')
       }],function()    {
             return     IO.puts('Invalid argument given');
           })),Patterns.defmatch(Patterns.make_case([Kernel.SpecialForms.atom('throw'), Kernel.SpecialForms.atom('Error')],function()    {
             return     IO.puts('caught error');
           })),null,null)
    """

    assert_translation(ex_ast, js_code)
  end
end