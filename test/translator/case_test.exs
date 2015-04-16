defmodule ElixirScript.Translator.Case.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate case" do
    ex_ast = quote do
      case data do
        :ok -> value
        :error -> nil
      end
    end

    js_code = """
      (function(){
        if(data == Atom('ok')){
          return value;
        }else if(data == Atom('error')){
          return null;
        }
      }());
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        false -> value = 13
        true  -> true
      end
    end

    js_code = """
      (function(){
        if(data == false){
          let value = 13;
          return value;
        }else if(data == true){
          return true;
        }
      }());    
    """

    assert_translation(ex_ast, js_code)



    ex_ast = quote do
      case data do
        false -> value = 13
        _  -> true
      end
    end

    js_code = """
      (function(){
        if(data == false){
          let value = 13;
          return value;
        }else{
          return true;
        }
      }());      
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with guard" do
    ex_ast = quote do
      case data do
        number when number in [1,2,3,4] -> 
          value = 13
        _  -> 
          true
      end
    end

    js_code = """
      (function(){
        if(Kernel._in(number, [1, 2, 3, 4])){
          let value = 13;
          return value;
        }else{
          return true;
        }
      }());
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with multiple statements in body" do
    ex_ast = quote do
      case data do
        :ok -> 
          Logger.info("info")
          Todo.add(data)
        :error -> 
          nil
      end
    end

    js_code = """
      (function(){
        if(data == Atom('ok')){
          Logger.info('info');
          return Todo.add(data);
        }else if(data == Atom('error')){
          return null;
        }
      }());
    """

    assert_translation(ex_ast, js_code)
  end
end