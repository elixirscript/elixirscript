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
      try{
        do_something_that_may_fail(some_arg)
      } catch(e){
        if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
          IO.puts('Invalid argument given')
        }else{
          throw e;
        }
      }
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
      try{
        do_something_that_may_fail(some_arg)
      } catch(e){
        if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
          IO.puts('Invalid argument given')
        }else{
          throw e;
        }
      }
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
      try {
        do_something_that_may_fail(some_arg)
      } catch (e) {
        if (Kernel.__in__(x, Erlang.list({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}))) {
          IO.puts('Invalid argument given')
        } else {
          throw e;
        }
      }
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
      try {
        do_something_that_may_fail(some_arg)
      } catch (e) {
        if (true) {
          let x = e;
          IO.puts('Invalid argument given')
        } else {
          throw e;
        }
      }
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
      try{
        do_something_that_may_fail(some_arg)
      } catch(e){
        if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
          IO.puts('ArgumentError')
        } else if (true) {
          let x = e;
          IO.puts('x')
        } else{
          throw e;
        }
      }
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
      try{
        do_something_that_may_fail(some_arg)
      } catch(e){
        if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
          IO.puts('Invalid argument given')
        }else{
          throw e;
        }
      } finally{
        IO.puts('This is printed regardless if it failed or succeed')
      }
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
      try{
        do_something_that_may_fail(some_arg)
      } finally{
        IO.puts('This is printed regardless if it failed or succeed')
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "raise when else or catch block exist" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      catch
        :throw, :sample ->
          IO.puts "This is printed regardless if it failed or succeed"
      end
    end

    assert_raise ElixirScript.UnsupportedError, "Currently unsupported \"else and catch blocks\"", fn ->
      ex_ast_to_js(ex_ast)
    end
  end
end