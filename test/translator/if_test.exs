defmodule ExToJS.Translator.If.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate if statement" do
    ex_ast = quote do
      if 1 == 1 do
        a = 1
      end
    end

    js_code = """
      (function(){
        if(1 == 1){
          let a = 1;
          return a;
        }
      }());
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      if 1 == 1 do
        a = 1
      else
        a = 2
      end
    end

    js_code = """
      (function(){
        if(1 == 1){
          let a = 1;
          return a;
        }else{
          let a = 2;
          return a;
        }
      }());
    """

    assert_translation(ex_ast, js_code)
  end
  
end