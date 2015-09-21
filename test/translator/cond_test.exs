defmodule ElixirScript.Translator.Cond.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate cond" do
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
    (function(){
      if(1 + 1 == 1){
        return 'This will never match';
      }else if(2 * 2 != 4){
        return 'Nor this';
      }else{
        return 'This will';
      }
    }.call(this))
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
     (function()    {
             if(1 + 1 == 1)     {
             let [a] = Patterns.match(Patterns.variable(),1);
             return     'This will never match';
           } else     if(2 * 2 != 4)         {
                 let [a] = Patterns.match(Patterns.variable(),2);
                 return     'Nor this';
               } else         {
                 let [a] = Patterns.match(Patterns.variable(),3);
                 return     'This will';
               }
           }.call(this))
    """

    assert_translation(ex_ast, js_code)
  end
end