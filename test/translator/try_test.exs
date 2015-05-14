defmodule ElixirScript.Translator.Try.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate " do
    ex_ast = quote do
      try do
        do_something_that_may_fail(some_arg)
      rescue
        ArgumentError ->
          IO.puts "Invalid argument given"
      end
    end

    js_code = """
      try{
        do_something_that_may_fail(some_arg);
      } catch(e){
        if(Kernel.match({__struct__: 'ArgumentError'}, e)){
          IO.puts('Invalid argument given');
        }else{
          throw e;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end
end