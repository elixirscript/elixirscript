defmodule ElixirScript.Translator.Function.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "call fun" do
    ex_ast = quote do
      fun.(:atom)
    end

    js_code = """
    fun(Elixir.Kernel.SpecialForms.atom('atom'))
    """

    assert_translation(ex_ast, js_code)

  end


  should "translate function with a macro" do
    ex_ast = quote do
      def test1() do
        ElixirScript.Math.squared(1)
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     1 * 1;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate functions" do
    ex_ast = quote do
      def test1() do
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
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
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
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
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
             return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
             return     2;
           },function(x)    {
             return     Elixir.Enum.member__qmark__(Elixir.Kernel.SpecialForms.list(false,null), x);
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
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
    const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        return     2;
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Elixir.Kernel.SpecialForms.list(false,null),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
        let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(), 1);
        return     a;
      },function(x)    {
        return     Elixir.Enum.member__qmark__(Elixir.Kernel.SpecialForms.list(false,null),x);
      }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
        return     4;
      })).call(this,2 == 2);
      })).call(this,1 == 1);
      }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        {a, b} = {1, 2}
      end
    end

    js_code = """
    const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()], function(alpha, beta) {
        let [a, b] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
            values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
        }), Elixir.Kernel.SpecialForms.tuple(1, 2));
        let _ref = Elixir.Kernel.SpecialForms.tuple(a, b);
        return _ref;
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate function calls" do
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

    js_code = "Elixir.Core.call_property(Taco, 'test1')"

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


  should "translate anonymous functions" do
    ex_ast = quote do
      Elixir.Enum.map(list, fn(x) -> x * 2 end)
    end

    js_code = """
     Elixir.Enum.map(list,Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(x)    {
             return     x * 2;
           })))
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate function arity" do
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
         const example = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(oneArg)    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg)    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg)    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg,blueArg)    {
             return     null;
           }));
         export {};
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
         const example = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([],function()    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(oneArg)    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg)    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg)    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(oneArg,twoArg,redArg,blueArg)    {
             return     null;
           }));
         export {
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
         const example = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(oneArg)    {
             return     null;
           }));
         export {
             example
       };
    """
    assert_translation(ex_ast, js_code)

  end

  should "test |> operator" do
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


  should "test Elixir.Kernel function" do
    ex_ast = quote do
      is_atom(:atom)
    end

    js_code = "Elixir$ElixirScript$Kernel.is_atom(Elixir.Kernel.SpecialForms.atom('atom'))"

    assert_translation(ex_ast, js_code)
  end

  should "guards" do
    ex_ast = quote do
      def something(one) when is_number(one) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(one)    {
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
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(one)    {
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
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(one)    {
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
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(one,two)    {
      return null;
    },function(one,two)    {
      return Elixir.Core.contains(one,Elixir.Kernel.SpecialForms.list(1,2,3));
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
         import * as Elixir$ElixirScript$Kernel from 'Elixir.ElixirScript.Kernel';
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir.Core.contains(one,Elixir.Kernel.SpecialForms.list(1,2,3));
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir$ElixirScript$Kernel.is_number(one) || Elixir$ElixirScript$Kernel.is_atom(one);
           }));
         export {
             something
       };
    """
    assert_translation(ex_ast, js_code)

  end

  should "pattern match function with literal" do
    ex_ast = quote do
      def something(1) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([1],function()    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with list" do
    ex_ast = quote do
      def something([apple | fruits]) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.headTail()],function(apple,fruits)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with multiple items in list" do
    ex_ast = quote do
      def something([apple, pear, banana]) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.variable())],function(apple,pear,banana)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with tuple" do
    ex_ast = quote do
      def something({ apple , fruits }) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
    })], function(apple, fruits) {
        return null;
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct" do
    ex_ast = quote do
      def something(%AStruct{}) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(AStruct, {})], function() {
        return null;
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct reference" do
    ex_ast = quote do
      def something(%AStruct{} = a) do
      end
    end

    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.capture(Elixir.Core.Patterns.type(AStruct, {}))], function(a) {
        return null;
    }));
    """
    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with map reference" do
    ex_ast = quote do
      def something(%{ which: 13 } = a) do
      end
    end

    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.capture({
             [Elixir.Kernel.SpecialForms.atom('which')]: 13
       })],function(a)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct decontructed" do
    ex_ast = quote do
      def something(%AStruct{key: value, key1: 2}) do
      end
    end


    js_code = """
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(AStruct, {
        [Elixir.Kernel.SpecialForms.atom('key')]: Elixir.Core.Patterns.variable(), [Elixir.Kernel.SpecialForms.atom('key1')]: 2
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
    const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(AStruct, {
        [Elixir.Kernel.SpecialForms.atom('key')]: Elixir.Core.Patterns.variable(), [Elixir.Kernel.SpecialForms.atom('key1')]: 2
    })], function(value) {
        return null;
    }, function(value) {
        return Elixir$ElixirScript$Kernel.is_number(value);
    }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with binary part" do
    ex_ast = quote do
      def something("Bearer " <> token) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.startsWith('Bearer ')],function(token)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.startsWith('Bearer '), Elixir.Core.Patterns.variable()],function(token,hotel)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel, 1) do
      end
    end


    js_code = """
     const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.startsWith('Bearer '), Elixir.Core.Patterns.variable(), 1],function(token,hotel)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

  should "combine pattern matched functions of same arity" do
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
         import * as Elixir$ElixirScript$Kernel from 'Elixir.ElixirScript.Kernel';
         const something = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([1],function()    {
             return     null;
           }),Elixir.Core.Patterns.make_case([2],function()    {
             return     null;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Elixir$ElixirScript$Kernel.is_binary(one);
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(one)    {
             return     null;
           }));
         export {
             something
       };
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate varible declaration correctly" do
    ex_ast = quote do
      def test1(alpha, beta) do
        a = 1
        a = 2
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
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
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
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
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha,beta)    {
             let [a] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),1);
             let [a1,b,c] = Elixir.Core.Patterns.match(Elixir.Kernel.SpecialForms.list(Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.variable(),Elixir.Core.Patterns.variable()),Elixir.Kernel.SpecialForms.list(a,2,3));
             let _ref = Elixir.Kernel.SpecialForms.list(a1,b,c);
             return     _ref;
           }));
    """

    assert_translation(ex_ast, js_code)
  end


  should "translate function variables with ? or !" do
    ex_ast = quote do
      def test1(alpha?, beta!) do
        a? = 1
        b! = 2
      end
    end

    js_code = """
     const test1 = Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()],function(alpha__qmark__,beta__emark__)    {
             let [a__qmark__] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),1);
             let [b__emark__] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),2);
             return     b__emark__;
           }));
    """

    assert_translation(ex_ast, js_code)
  end

end
