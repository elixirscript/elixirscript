defmodule ElixirScript.Translator.If.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate if statement" do
    ex_ast = quote do
      if 1 == 1 do
        a = 1
      end
    end

    js_code = """
      (function(){
        if(1 == 1){
          let a0 = 1;
          return a0;
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
          let a0 = 1;
          return a0;
        }else{
          let a1 = 2;
          return a1;
        }
      }());
    """

    assert_translation(ex_ast, js_code)
  end
  
end