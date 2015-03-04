defmodule ExToJS.Translator.Cond.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate cond" do
    ex_ast = quote do
      cond do
        1 + 1 == 1 ->
          "This will never match"
        2 * 2 != 4 ->
          "Nor this"
        true ->
          "This will"
      end
    end

    js_code = """
      if(1 + 1 == 1){
        'This will never match'
      }else if(2 * 2 != 4){
        'Nor this'
      }else{
        'This will'
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      cond do
        1 + 1 == 1 ->
          a = 1
          "This will never match"
        2 * 2 != 4 ->
          a = 2
          "Nor this"
        true ->
          a = 3
          "This will"
      end
    end

    js_code = """
      if(1 + 1 == 1){
        let a = 1;
        'This will never match'
      }else if(2 * 2 != 4){
        let a = 2;
        'Nor this'
      }else{
        let a = 3;
        'This will'
      }
    """

    assert_translation(ex_ast, js_code)
  end
end