defmodule ElixirScript.Translator.Try.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate with a rescue with one match" do
    ex_ast = quote do
      try do
        1
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
<<<<<<< HEAD
    Bootstrap.Core.SpecialForms._try(async function() {
        return 1;
    }, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.type(ArgumentError, {})], async function() {
    return Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
    })), null, null, null)
=======
         Bootstrap.Core.SpecialForms._try(function() {
             return 1;
         }, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([{
             [Symbol.for('__struct__')]: Symbol.for('Elixir.ElixirScript.ArgumentError')
         }], function() {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
         })), null, null, null)
>>>>>>> master
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue with a list match" do
    ex_ast = quote do

      try do
        1
      rescue
        [ArgumentError] ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
<<<<<<< HEAD
    Bootstrap.Core.SpecialForms._try(async function() {
        return 1;
    }, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.type(ArgumentError, {})], async function() {
    return Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
    })), null, null, null)
=======
         Bootstrap.Core.SpecialForms._try(function() {
             return 1;
         }, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([{
             [Symbol.for('__struct__')]: Symbol.for('Elixir.ElixirScript.ArgumentError')
         }], function() {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
         })), null, null, null)
>>>>>>> master
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue with an in guard" do
    ex_ast = quote do

      try do
        1
      rescue
        x in [ArgumentError] ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
         Bootstrap.Core.SpecialForms._try(async function()    {
             return     1;
           },Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],async function(x)    {
           return     Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
<<<<<<< HEAD
           },async function(x)    {
           return     Elixir.ElixirScript.Bootstrap.Functions.__load(Elixir).contains(x,Object.freeze([ArgumentError.create(Object.freeze({}))]));
=======
           },function(x)    {
           return Elixir.ElixirScript.Bootstrap.Functions.__load(Elixir).contains(x, Object.freeze([Elixir.ElixirScript.ArgumentError.__load(Elixir).__struct__(Object.freeze({}))]));
>>>>>>> master
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue with an identifier" do
    ex_ast = quote do

      try do
        1
      rescue
        x ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
     Bootstrap.Core.SpecialForms._try(async function()    {
             return     1;
           },Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],async function(x)    {
           return     Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
           })),null,null,null)
    """

    assert_translation(ex_ast, js_code)
  end


  test "translate with a rescue with multiple patterns" do
    ex_ast = quote do

      try do
        1
      rescue
        [ArgumentError] ->
          IO.puts "ArgumentError"
        x ->
          IO.puts "x"
      end
    end

    js_code = """
         Bootstrap.Core.SpecialForms._try(function() {
             return 1;
         }, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([{
             [Symbol.for('__struct__')]: Symbol.for('Elixir.ElixirScript.ArgumentError')
         }], function() {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('ArgumentError');
         }), Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()], function(x) {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('x');
         })), null, null, null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with a rescue and after clause" do
    ex_ast = quote do

      try do
        1
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      after
        IO.puts "This is printed regardless if it failed or succeed"
      end
    end

    js_code = """
         Bootstrap.Core.SpecialForms._try(function() {
             return 1;
         }, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([{
             [Symbol.for('__struct__')]: Symbol.for('Elixir.ElixirScript.ArgumentError')
         }], function() {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
         })), null, null, function() {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('This is printed regardless if it failed or succeed');
         })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate with an after clause" do
    ex_ast = quote do

      try do
        1
      after
        IO.puts "This is printed regardless if it failed or succeed"
      end
    end

    js_code = """
     Bootstrap.Core.SpecialForms._try(async function()    {
             return     1;
           },null,null,null,async function()    {
           return     Elixir.ElixirScript.IO.__load(Elixir).puts('This is printed regardless if it failed or succeed');
           })
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate else" do
    ex_ast = quote do
      x = 1
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
    Bootstrap.Core.SpecialForms._try(async function() {
      return 1 / x;
    }, null, null, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()], async function(y) {
      return Symbol.for('small');
    }, async function(y) {
      return y < 1 && y > -1;
    }), Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()], async function(__ignored__) {
      return Symbol.for('large');
    })), null)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate catch" do
    ex_ast = quote do
      try do
        1
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      catch
        :throw, :Error ->
          IO.puts "caught error"
      end
    end

    js_code = """
         Bootstrap.Core.SpecialForms._try(function() {
             return 1;
         }, Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([{
             [Symbol.for('__struct__')]: Symbol.for('Elixir.ElixirScript.ArgumentError')
         }], function() {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('Invalid argument given');
         })), Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Symbol.for('throw'), Symbol.for('Error')], function() {
             return Elixir.ElixirScript.IO.__load(Elixir).puts('caught error');
         })), null, null)
    """

    assert_translation(ex_ast, js_code)
  end
end
