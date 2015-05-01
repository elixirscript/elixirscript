defmodule ElixirScript.Translator.For.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple for" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], do: n * 2
    end

    js_code = """
      (function(){
        var _results = [];

        for(var n of [1,2,3,4])
          _results.push(n * 2);
        
        return _results;
      }());
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with string" do
    ex_ast = quote do
      for n <- "Opera", do: n
    end

    js_code = """
      (function(){
        var _results = [];

        for(var n of 'Opera')
          _results.push(n);
        
        return _results;
      }());
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate multiple generator for" do
    ex_ast = quote do
      for x <- [1, 2], y <- [2, 3], do: x*y
    end

    js_code = """
      (function(){
        var _results = [];

        for(var x of [1,2])
          for(var y of [2,3])
            _results.push(x * y);
          
        return _results;
      }());
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
      var r = (function(){
        var _results = [];

        for(var x of [1,2])
          for(var y of [2,3])
            _results.push(x * y);
          
        return _results;
      }());;
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate for with filter" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4, 5, 6], rem(n, 2) == 0, do: n
    end

    js_code = """
      (function(){
        var _results = [];

        for(var n of [1, 2, 3, 4, 5, 6])
          if(Kernel.rem(n, 2) == 0)
            _results.push(n);

        return _results;
      }());
    """

    assert_translation(ex_ast, js_code)
  end
end