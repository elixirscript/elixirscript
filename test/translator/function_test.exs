defmodule ElixirScript.Translator.Function.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "call fun" do
    ex_ast = quote do
      fun.(:atom)
    end

    js_code = """
    fun(Symbol.for('atom'))
    """

    assert_translation(ex_ast, js_code)

  end


  test "translate function with a macro" do
    ex_ast = quote do
      def test1() do
        ElixirScript.Math.squared(1)
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
             return     1 * 1;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate functions" do
    ex_ast = quote do
      def test1() do
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        a = alpha
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
             let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),alpha);
             return     a;
           }));
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
         const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
             return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(x)    {
             return     2;
           },function(x)    {
           return x === null || x === false;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
             return     1;
           })).call(this,1 == 1);
           }));
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
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()], function(alpha, beta) {
         return Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()], function(x) {
             return 2;
         }, function(x) {
             return x === null || x === false;
         }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
             return Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()], function(x) {
                 let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), 1);

                 return a;
             }, function(x) {
                 return x === null || x === false;
             }), Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
                 return 4;
             })).call(this, 2 == 2);
         })).call(this, 1 == 1);
     }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        {a, b} = {1, 2}
      end
    end

    js_code = """
    const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()], function(alpha, beta) {
        let [a, b] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
            values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
        }), new Elixir.Core.Tuple(1, 2));
        let _ref = new Elixir.Core.Tuple(a, b);
        return _ref;
    }));
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
      test?()
    end

    js_code = "test__qmark__()"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      test1(3, 2)
    end

    js_code = "test1(3,2)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      Taco.test1()
    end

    js_code = "Elixir.Core.Functions.call_property(Taco, 'test1')"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      Taco.test1(3, 2)
    end

    js_code = "Taco.test1(3,2)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      Taco.test1(Taco.test2(1), 2)
    end

    js_code = "Taco.test1(Taco.test2(1),2)"

    assert_translation(ex_ast, js_code)
  end


  test "translate anonymous functions" do
    ex_ast = quote do
      Elixir.Enum.map(list, fn(x) -> x * 2 end)
    end

    js_code = """
     Elixir.Enum.map(list,Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(x)    {
             return     x * 2;
           })))
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate function arity" do
    ex_ast = quote do
      defmodule Example do

        defp example() do
        end

        defp example(oneArg) do
        end

        defp example(oneArg, twoArg) do
        end

        defp example(oneArg, twoArg, redArg) do
        end

        defp example(oneArg, twoArg, redArg, blueArg) do
        end
      end
    end

    js_code = """
          import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const example = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(oneArg)    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg)    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg)    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg,blueArg)    {
             return     null;
           }));
         export default {};
    """
    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      defmodule Example do
        def example() do
        end

        def example(oneArg) do
        end

        def example(oneArg, twoArg) do
        end

        def example(oneArg, twoArg, redArg) do
        end

        def example(oneArg, twoArg, redArg, blueArg) do
        end
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const example = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([],function()    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(oneArg)    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg)    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg)    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg,blueArg)    {
             return     null;
           }));
         export default {
             example
       };
    """
    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      defmodule Example do
        def example(oneArg) do
        end
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const example = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(oneArg)    {
             return     null;
           }));
         export default {
             example
       };
    """
    assert_translation(ex_ast, js_code)

  end

  test "test |> operator" do
    ex_ast = quote do
      1 |> Taco.test
    end

    js_code = "Taco.test(1)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      1 |> Taco.test |> Home.hello("hi")
    end

    js_code = "Home.hello(Taco.test(1), 'hi')"

    assert_translation(ex_ast, js_code)
  end


  test "test Elixir.Kernel function" do
    ex_ast = quote do
      is_atom(:atom)
    end

    js_code = "Elixir$ElixirScript$Kernel.is_atom(Symbol.for('atom'))"

    assert_translation(ex_ast, js_code)
  end

  test "guards" do
    ex_ast = quote do
      def something(one) when is_number(one) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir$ElixirScript$Kernel.is_number(one);
           }));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      def something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return Elixir$ElixirScript$Kernel.is_number(one) || Elixir$ElixirScript$Kernel.is_atom(one);
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir$ElixirScript$Kernel.is_number(one) || Elixir$ElixirScript$Kernel.is_atom(one);
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one, two) when one in [1, 2, 3] do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(one,two)    {
      return null;
    },function(one,two)    {
      return Elixir.Core.Functions.contains(one,Object.freeze([1, 2, 3]));
    }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule Example do
        def something(one) when one in [1, 2, 3] do
        end

        def something(one) when is_number(one) or is_atom(one) do
        end
      end
    end

    js_code = """
    import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir.Core.Functions.contains(one,Object.freeze([1, 2, 3]));
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir$ElixirScript$Kernel.is_number(one) || Elixir$ElixirScript$Kernel.is_atom(one);
           }));
         export default {
             something
       };
    """
    assert_translation(ex_ast, js_code)

  end

  test "pattern match function with literal" do
    ex_ast = quote do
      def something(1) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([1],function()    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with list" do
    ex_ast = quote do
      def something([apple | fruits]) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.headTail(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.variable())],function(apple,fruits)    {
    return     null;
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with multiple items in list" do
    ex_ast = quote do
      def something([apple, pear, banana]) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Object.freeze([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()])],function(apple,pear,banana)    {
       return     null;
     }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with tuple" do
    ex_ast = quote do
      def something({ apple , fruits }) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
    })], function(apple, fruits) {
        return null;
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with struct" do
    ex_ast = quote do
      def something(%AStruct{}) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(AStruct, {})], function() {
        return null;
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with struct reference" do
    ex_ast = quote do
      def something(%AStruct{} = a) do
      end
    end

    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.capture(Elixir.Core.Patterns.type(AStruct, {}))], function(a) {
        return null;
    }));
    """
    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with map reference" do
    ex_ast = quote do
      def something(%{ which: 13 } = a) do
      end
    end

    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.capture({
             [Symbol.for('which')]: 13
       })],function(a)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with struct decontructed" do
    ex_ast = quote do
      def something(%AStruct{key: value, key1: 2}) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(AStruct, {
        [Symbol.for('key')]: Elixir.Core.Patterns.variable(), [Symbol.for('key1')]: 2
    })], function(value) {
        return null;
    }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something(%AStruct{key: value, key1: 2}) when is_number(value) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(AStruct, {
        [Symbol.for('key')]: Elixir.Core.Patterns.variable(), [Symbol.for('key1')]: 2
    })], function(value) {
        return null;
    }, function(value) {
        return Elixir$ElixirScript$Kernel.is_number(value);
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "pattern match function with binary part" do
    ex_ast = quote do
      def something("Bearer " <> token) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.startsWith('Bearer ')],function(token)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.startsWith('Bearer '), Elixir.Core.Patterns.variable()],function(token,hotel)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel, 1) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.startsWith('Bearer '), Elixir.Core.Patterns.variable(), 1],function(token,hotel)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "combine pattern matched functions of same arity" do
    ex_ast = quote do
      defmodule Example do
        def something(1) do
        end

        def something(2) do
        end

        def something(one) when is_binary(one) do
        end

        def something(one) do
        end
      end

    end


    js_code = """
    import Elixir$ElixirScript$Kernel from '../elixir/Elixir.ElixirScript.Kernel';
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([1],function()    {
             return     null;
           }),Elixir.Core.Patterns.clause([2],function()    {
             return     null;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir$ElixirScript$Kernel.is_binary(one);
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           }));
         export default {
             something
       };
    """

    assert_translation(ex_ast, js_code)

  end

  test "translate varible declaration correctly" do
    ex_ast = quote do
      def test1(alpha, beta) do
        a = 1
        a = 2
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
             let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),1);
             let [a1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),2);
             return     a1;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        a = 1
        a = a
        a = 2
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
             let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),1);
             let [a1] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),a);
             let [a2] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),2);
             return     a2;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        a = 1
        [a, b, c] = [a, 2, 3]
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
         let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),1);
         let [a1,b,c] = Elixir.Core.Patterns.match(Object.freeze([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]),Object.freeze([a, 2, 3]));
         let _ref = Object.freeze([a1, b, c]);
         return     _ref;
       }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate function variables with ? or !" do
    ex_ast = quote do
      def test1(alpha?, beta!) do
        a? = 1
        b! = 2
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha__qmark__,beta__emark__)    {
             let [a__qmark__] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),1);
             let [b__emark__] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),2);
             return     b__emark__;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate function params with defaults" do
    ex_ast = quote do
      def test1(alpha, beta \\ 0) do
      end
    end

    js_code = """
    const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(0)],function(alpha,beta)    {
      return     null;
    }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha \\ fn x -> x end) do
      end
    end

    js_code = """
    const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable(Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(x)    {
      return     x;
    })))],
    function(alpha)    {
      return     null;
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  test "def with catch" do
    ex_ast = quote do
      defp func(param) do
        if true do
          nil
        else
          :error
        end
      catch
        :invalid -> :error
      end
    end

    js_code = """
    const func = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],
    function(param) {
      return Elixir.Core.SpecialForms._try(function() {
        return Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()], function(x) {
          return Symbol.for('error');
        },
        function(x) {
        return x === null || x === false;
        }),
        Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()], function() {
            return null;
        })).call(this, true);
      },
      null,
      Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Symbol.for('invalid')], function() {
        return Symbol.for('error');
      })),
      null,
      null
     );
    }));
    """

    assert_translation(ex_ast, js_code)
  end


  test "translate anonymous function with variable bound" do
    ex_ast = quote do
      key = "test"
      fn ^key -> :ok end
    end

    js_code = """
    let [key] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),'test');

    Elixir.Core.Patterns.defmatch(
      Elixir.Core.Patterns.clause(
        [Elixir.Core.Patterns.bound(key)],
        function() {
          return Symbol.for('ok');
        }
      )
    )
    """

    assert_translation(ex_ast, js_code)
  end
end
