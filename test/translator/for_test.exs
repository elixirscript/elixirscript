defmodule ElixirScript.Translator.For.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate simple for" do
    ex_ast = quote do
      for n <- [1, 2, 3, 4], do: n * 2
    end

    js_code = """
      (function(){
        let _results = [];

        for(let n of [1,2,3,4]){
          _results.push(n * 2);
        }
        
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
        let _results = [];

        for(let n of 'Opera'){
          _results.push(n);
        }
        
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
        let _results = [];

        for(let x of [1,2]){
          for(let y of [2,3]){
            _results.push(x * y);
          }
        }
          
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
      let r = (function(){
        let _results = [];

        for(let x of [1,2]){
          for(let y of [2,3]){
            _results.push(x * y);
          }
        }
          
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
        let _results = [];

        for(let n of [1, 2, 3, 4, 5, 6]){
            if(Kernel.rem(n, 2) == 0)
              _results.push(n);
        }

        return _results;
      }());
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
      (function(){
        let _results = [];

        for(let _ref of [Tuple(Atom('user'), 'john'), Tuple(Atom('admin'), 'john'), Tuple(Atom('user'), 'meg')]){
          if(Kernel.match(_ref, Tuple(Atom('user'), undefined))){
            let name = _ref[1];
            _results.push(String.upcase(name));
          }
        }

        return _results;
      }());
    """

    assert_translation(ex_ast, js_code)
  end
end