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
      (function(){
        try{
          return do_something_that_may_fail(some_arg);
        } catch(e){
          if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
            return IO.puts('Invalid argument given');
          }else{
            throw e;
          }
        }
      }.call(this));
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
      (function(){
        try{
          return do_something_that_may_fail(some_arg);
        } catch(e){
          if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
            return IO.puts('Invalid argument given');
          }else{
            throw e;
          }
        }
      }.call(this));
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
      (function(){
        try {
          return do_something_that_may_fail(some_arg);
        } catch (e) {
          if (Kernel.__in__(x, Erlang.list({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}))) {
            return IO.puts('Invalid argument given');
          } else {
            throw e;
          }
        }
      }.call(this));
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
      (function(){
        try {
          return do_something_that_may_fail(some_arg);
        } catch (e) {
          if (true) {
            let x = e;
            return IO.puts('Invalid argument given');
          } else {
            throw e;
          }
        }
      }.call(this));
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
      (function(){
        try{
          return do_something_that_may_fail(some_arg);
        } catch(e){
          if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
            return IO.puts('ArgumentError');
          } else if (true) {
            let x = e;
            return IO.puts('x');
          } else{
            throw e;
          }
        }
      }.call(this));
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
      (function(){
        try{
          return do_something_that_may_fail(some_arg);
        } catch(e){
          if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
            return IO.puts('Invalid argument given');
          }else{
            throw e;
          }
        } finally{
          return IO.puts('This is printed regardless if it failed or succeed');
        }
      }.call(this));
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
      (function(){
        try{
          return do_something_that_may_fail(some_arg);
        } finally{
          return IO.puts('This is printed regardless if it failed or succeed');
        }
      }.call(this));
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

    assert_raise ElixirScript.UnsupportedError, "Currently unsupported \"try with else block\"", fn ->
      ex_ast_to_js(ex_ast)
    end
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
      (function(){
        try{
          return do_something_that_may_fail(some_arg);
        } catch(e){
          if(e instanceof Error){
            return IO.puts('caught error');          
          } else if(Kernel.match__qmark__({'__struct__': Erlang.list(Erlang.atom('ArgumentError'))}, e)){
            return IO.puts('Invalid argument given');
          }else{
            throw e;
          }
        }
      }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end
end