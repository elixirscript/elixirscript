defmodule ExToJS.Translator.Test do
  use ExUnit.Case
  import ExToJS.TestHelper

  test "translate nil" do
    ex_ast = quote do: nil
    assert_translation(ex_ast, "null")
  end

  test "translate numbers" do
    ex_ast = quote do: 1
    assert_translation(ex_ast, "1")

    ex_ast = quote do: 1_000
    assert_translation(ex_ast, "1000")

    ex_ast = quote do: 1.1
    assert_translation(ex_ast, "1.1")

    ex_ast = quote do: -1.1
    assert_translation(ex_ast, "-1.1")
  end

  test "translate string" do
    ex_ast = quote do: "Hello"
    assert_translation(ex_ast, "'Hello'")

    ex_ast = quote do: "Hello" <> "World"
    assert_translation(ex_ast, "'Hello' + 'World'")
  end

  test "translate atom" do
    ex_ast = quote do: :atom
    assert_translation(ex_ast, "Symbol('atom')")
  end

  test "translate list" do
    ex_ast = quote do: [1, 2, 3]
    js_code = "[1, 2, 3]"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: ["a", "b", "c"]
    js_code = "['a', 'b', 'c']"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, :b, :c]
    js_code = "[Symbol('a'), Symbol('b'), Symbol('c')]" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: [:a, 2, "c"]
    js_code = "[Symbol('a'), 2, 'c']"

    assert_translation(ex_ast, js_code)
  end

  test "translate tuple" do
    ex_ast = quote do: {1, 2, 3}
    js_code = "[1, 2, 3]"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {"a", "b", "c"}
    js_code = "['a', 'b', 'c']"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, :b, :c}
    js_code = "[Symbol('a'), Symbol('b'), Symbol('c')]" 
    
    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {:a, 2, "c"}
    js_code = "[Symbol('a'), 2, 'c']"

    assert_translation(ex_ast, js_code)
  end

  test "translate assignment" do
    ex_ast = quote do: a = 1
    js_code = "let a = 1;"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: a = :atom
    js_code = "let a = Symbol('atom');"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do: {a, b} = {1, 2}
    js_code = "let [a,b] = [1,2];"

    assert_translation(ex_ast, js_code)
  end

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

  test "translate defmodules" do
    ex_ast = quote do
      defmodule Elephant do
      end
    end

    assert_translation(ex_ast, "")

    ex_ast = quote do
      defmodule Elephant do
        def something() do
        end

        defp something_else() do
        end
      end
    end

    js_code = """
      export function something(){
        return null;
      }

      function something_else(){
        return null;
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule Elephant do
        alias Icabod.Crane

        def something() do
        end

        defp something_else() do
        end
      end
    end

    js_code = """
      import * as Crane from 'icabod/crane';

      export function something(){
        return null;
      }

      function something_else(){
        return null;
      }
    """

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

  test "translate struct" do
    ex_ast = quote do
      defmodule User do
        defstruct name: "john", age: 27
      end
    end

    js_code = """
      export class User {
        constructor(name = 'john', age = 27){
          this.name = name;
          this.age = age;
        }
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        defstruct :name, :age
      end
    end

    js_code = """
      export class User {
        constructor(name, age){
          this.name = name;
          this.age = age;
        }
      }
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate import" do
    ex_ast = quote do
      defmodule User do
        import Hello.World
      end
    end

    js_code = """
      import * as World from 'hello/world';
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule User do
        import US, only: [la: 1, al: 2]
      end
    end

    js_code = """
      import { la, al } from 'us';
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      defmodule User do
        alias Hello.World
      end
    end

    js_code = """
      import * as World from 'hello/world';
    """

    assert_translation(ex_ast, js_code)

  end

end