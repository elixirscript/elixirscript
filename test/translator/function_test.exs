defmodule ExToJS.Translator.Function.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate functions" do
    ex_ast = quote do
      def test1() do
      end
    end

    js_code = """
      export function test1(){
        return null;
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
      end
    end

    js_code = """
      export function test1(alpha, beta){
        return null;
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        a = alpha
      end
    end

    js_code = """
      export function test1(alpha, beta){
        let a = alpha;
        return a;
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        if 1 == 1 do
          1
        else
          2
        end
      end
    end

    js_code = """
      export function test1(alpha, beta){
        if(1 == 1){
          return 1;
        }else{
          return 2;
        }
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        if 1 == 1 do
          if 2 == 2 do
            4
          else
            a = 1
          end
        else
          2
        end
      end
    end

    js_code = """
      export function test1(alpha, beta){
        if(1 == 1){
          if(2 == 2){
            return 4;
          }else{
            let a = 1;
            return a;
          }
        }else{
          return 2;
        }
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        {a, b} = {1, 2}
      end
    end

    js_code = """
      export function test1(alpha, beta){
        let [a,b] = [1,2];
        return [a,b];
      }
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate function calls" do
    ex_ast = quote do
      test1()
    end

    js_code = "test1()"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      test1(3, 2)
    end

    js_code = "test1(3,2)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      Taco.test1(3, 2)
    end

    js_code = "Taco.test1(3,2)"   

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      Taco.test1(Taco.test2(), 2)
    end

    js_code = "Taco.test1(Taco.test2(),2)"   

    assert_translation(ex_ast, js_code)
  end


    test "translate anonymous functions" do
    ex_ast = quote do
      Enum.map(list, fn(x) -> x * 2 end)
    end

    js_code = "Enum.map(list, x => x * 2)"

    assert_translation(ex_ast, js_code)
  end

  test "translate if statement" do
    ex_ast = quote do
      if 1 == 1 do
        a = 1
      end
    end

    js_code = """
      if(1 == 1){
        let a = 1;
      }
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
      if(1 == 1){
        let a = 1;
      }else{
        let a = 2;
      }
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate length function" do
    ex_ast = quote do: length(args)

    js_code = "args.length"

    assert_translation(ex_ast, js_code)
  end
  
end