defmodule ExToJS.Translator.Case.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate case" do
    ex_ast = quote do
      case data do
        :ok -> value
        :error -> nil
      end
    end

    js_code = """
      if(data == Symbol('ok')){
          value
        }else if(data == Symbol('error')){
          null
        }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        false -> value = 13
        true  -> true
      end
    end

    js_code = """
      if(data == false){
          let value = 13;
        }else if(data == true){
          true
        }
    """

    assert_translation(ex_ast, js_code)



    ex_ast = quote do
      case data do
        false -> value = 13
        _  -> true
      end
    end

    js_code = """
      if(data == false){
          let value = 13;
        }else{
          true
        }
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
      if([1,2,3,4].includes(data)){
          let value = 13;
        }else{
          true
        }
    """

    assert_translation(ex_ast, js_code)
  end
end