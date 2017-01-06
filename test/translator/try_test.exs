defmodule ElixirScript.Translator.Try.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate with a rescue with one match" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
    Elixir.Core.SpecialForms._try(function() {
        return do_something_that_may_fail(some_arg);
    }, Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(ArgumentError, {})], function() {
        return IO.puts('Invalid argument given');
    })), null, null, null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue with a list match" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        [ArgumentError] ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
    Elixir.Core.SpecialForms._try(function() {
        return do_something_that_may_fail(some_arg);
    }, Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(ArgumentError, {})], function() {
        return IO.puts('Invalid argument given');
    })), null, null, null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue with an in guard" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        x in [ArgumentError] ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
         Elixir.Core.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(x)    {
             return     IO.puts('Invalid argument given');
           },function(x)    {
             return     Elixir.Core.Functions.contains(x,Object.freeze([ArgumentError.create(Object.freeze({}))]));
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue with an identifier" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        x ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
     Elixir.Core.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(x)    {
             return     IO.puts('Invalid argument given');
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end


  test "translate with a rescue with multiple patterns" do
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
    Elixir.Core.SpecialForms._try(function() {
        return do_something_that_may_fail(some_arg);
    }, Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(ArgumentError, {})], function() {
        return IO.puts('ArgumentError');
    }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()], function(x) {
        return IO.puts('x');
    })), null, null, null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue and after clause" do
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
    Elixir.Core.SpecialForms._try(function() {
        return do_something_that_may_fail(some_arg);
    }, Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(ArgumentError, {})], function() {
        return IO.puts('Invalid argument given');
    })), null, null, function() {
        return IO.puts('This is printed regardless if it failed or succeed');
    })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with an after clause" do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      after
        IO.puts "This is printed regardless if it failed or succeed"
      end
    end

    js_code = """
     Elixir.Core.SpecialForms._try(function()    {
             return     do_something_that_may_fail(some_arg);
           },null,null,null,function()    {
             return     IO.puts('This is printed regardless if it failed or succeed');
           })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate else" do
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
    Elixir.Core.SpecialForms._try(function() {
      return 1 / x;
    }, null, null, Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()], function(y) {
      return Symbol.for('small');
    }, function(y) {
      return y < 1 && y > -1;
    }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
      return Symbol.for('large');
    })), null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate catch" do
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
    Elixir.Core.SpecialForms._try(function() {
        return do_something_that_may_fail(some_arg);
    }, Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(ArgumentError, {})], function() {
        return IO.puts('Invalid argument given');
    })), Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Symbol.for('throw'), Symbol.for('Error')], function() {
        return IO.puts('caught error');
    })), null, null)
    """

    assert_translation(ex_ast, js_code)
  end
end
