defmodule ElixirScript.Translator.Function.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "call fun" do
    ex_ast = quote do
      fun.(:atom)
    end

    js_code = """
    fun(Kernel.SpecialForms.atom('atom'))
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
     let test1 = Patterns.defmatch(Patterns.make_case([],function()    {
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
     let test1 = Patterns.defmatch(Patterns.make_case([],function()    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
      end
    end

    js_code = """
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
             let [a0] = Patterns.match(Patterns.variable(),alpha);
             return     a0;
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
             return     Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
             return     2;
           },function(x)    {
             return     Kernel.__in__(x,Kernel.SpecialForms.list(false,null));
           }),Patterns.make_case([Patterns.wildcard()],function()    {
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
             return     Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
             return     2;
           },function(x)    {
             return     Kernel.__in__(x,Kernel.SpecialForms.list(false,null));
           }),Patterns.make_case([Patterns.wildcard()],function()    {
             return     Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
             let [a000] = Patterns.match(Patterns.variable(),1);
             return     a000;
           },function(x)    {
             return     Kernel.__in__(x,Kernel.SpecialForms.list(false,null));
           }),Patterns.make_case([Patterns.wildcard()],function()    {
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
             let [a0,b0] = Patterns.match(Kernel.SpecialForms.tuple(Patterns.variable(),Patterns.variable()),Kernel.SpecialForms.tuple(1,2));
             let _ref = Kernel.SpecialForms.tuple(a0,b0);
             return     _ref;
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

    js_code = "JS.get_property_or_call_function(Taco, 'test1')"   

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
      Enum.map(list, fn(x) -> x * 2 end)
    end

    js_code = """
     Enum.map(list,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
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
         const __MODULE__ = Kernel.SpecialForms.atom('Example');
         let example = Patterns.defmatch(Patterns.make_case([],function()    {
             return     null;
           }),Patterns.make_case([Patterns.variable()],function(oneArg)    {
             return     null;
           }),Patterns.make_case([Patterns.variable(), Patterns.variable()],function(oneArg,twoArg)    {
             return     null;
           }),Patterns.make_case([Patterns.variable(), Patterns.variable(), Patterns.variable()],function(oneArg,twoArg,redArg)    {
             return     null;
           }),Patterns.make_case([Patterns.variable(), Patterns.variable(), Patterns.variable(), Patterns.variable()],function(oneArg,twoArg,redArg,blueArg)    {
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
         const __MODULE__ = Kernel.SpecialForms.atom('Example');
         let example = Patterns.defmatch(Patterns.make_case([],function()    {
             return     null;
           }),Patterns.make_case([Patterns.variable()],function(oneArg)    {
             return     null;
           }),Patterns.make_case([Patterns.variable(), Patterns.variable()],function(oneArg,twoArg)    {
             return     null;
           }),Patterns.make_case([Patterns.variable(), Patterns.variable(), Patterns.variable()],function(oneArg,twoArg,redArg)    {
             return     null;
           }),Patterns.make_case([Patterns.variable(), Patterns.variable(), Patterns.variable(), Patterns.variable()],function(oneArg,twoArg,redArg,blueArg)    {
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
         const __MODULE__ = Kernel.SpecialForms.atom('Example');
         let example = Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(oneArg)    {
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


  should "test Kernel function" do
    ex_ast = quote do
      is_atom(:atom)
    end

    js_code = "Kernel.is_atom(Kernel.SpecialForms.atom('atom'))"

    assert_translation(ex_ast, js_code)
  end

  should "guards" do
    ex_ast = quote do
      def something(one) when is_number(one) do
      end
    end


    js_code = """
     let something = Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Kernel.is_number(one);
           }));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      def something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
     let something = Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Kernel.is_number(one) || Kernel.is_atom(one);
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
     let something = Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Kernel.is_number(one) || Kernel.is_atom(one);
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one, two) when one in [1, 2, 3] do
      end
    end


    js_code = """
     let something = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(one,two)    {
             return     null;
           },function(one,two)    {
             return     Kernel.__in__(one,Kernel.SpecialForms.list(1,2,3));
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
         const __MODULE__ = Kernel.SpecialForms.atom('Example');
         let something = Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Kernel.__in__(one,Kernel.SpecialForms.list(1,2,3));
           }),Patterns.make_case([Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Kernel.is_number(one) || Kernel.is_atom(one);
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
     let something = Patterns.defmatch(Patterns.make_case([1],function()    {
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
     let something = Patterns.defmatch(Patterns.make_case([Patterns.headTail()],function(apple,fruits)    {
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
     let something = Patterns.defmatch(Patterns.make_case([Kernel.SpecialForms.list(Patterns.variable(),Patterns.variable(),Patterns.variable())],function(apple,pear,banana)    {
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
     let something = Patterns.defmatch(Patterns.make_case([Kernel.SpecialForms.tuple(Patterns.variable(),Patterns.variable())],function(apple,fruits)    {
             return     null;
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
     let something = Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('AStruct')
       }],function()    {
             return     null;
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
     let something = Patterns.defmatch(Patterns.make_case([Patterns.capture({
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('AStruct')
       })],function(a)    {
             return     null;
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
     let something = Patterns.defmatch(Patterns.make_case([Patterns.capture({
             [Kernel.SpecialForms.atom('which')]: 13
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
     let something = Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('AStruct'),     [Kernel.SpecialForms.atom('key')]: Patterns.variable(),     [Kernel.SpecialForms.atom('key1')]: 2
       }],function(value)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something(%AStruct{key: value, key1: 2}) when is_number(value) do
      end
    end


    js_code = """
     let something = Patterns.defmatch(Patterns.make_case([{
             [Kernel.SpecialForms.atom('__struct__')]: Kernel.SpecialForms.atom('AStruct'),     [Kernel.SpecialForms.atom('key')]: Patterns.variable(),     [Kernel.SpecialForms.atom('key1')]: 2
       }],function(value)    {
             return     null;
           },function(value)    {
             return     Kernel.is_number(value);
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
     let something = Patterns.defmatch(Patterns.make_case([Patterns.startsWith('Bearer ')],function(token)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel) do
      end
    end


    js_code = """
     let something = Patterns.defmatch(Patterns.make_case([Patterns.startsWith('Bearer '), Patterns.variable()],function(token,hotel)    {
             return     null;
           }));
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel, 1) do
      end
    end


    js_code = """
     let something = Patterns.defmatch(Patterns.make_case([Patterns.startsWith('Bearer '), Patterns.variable(), 1],function(token,hotel)    {
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
         const __MODULE__ = Kernel.SpecialForms.atom('Example');
         let something = Patterns.defmatch(Patterns.make_case([1],function()    {
             return     null;
           }),Patterns.make_case([2],function()    {
             return     null;
           }),Patterns.make_case([Patterns.variable()],function(one)    {
             return     null;
           },function(one)    {
             return     Kernel.is_binary(one);
           }),Patterns.make_case([Patterns.variable()],function(one)    {
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
             let [a0] = Patterns.match(Patterns.variable(),1);
             let [a1] = Patterns.match(Patterns.variable(),2);
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
             let [a0] = Patterns.match(Patterns.variable(),1);
             let [a1] = Patterns.match(Patterns.variable(),a0);
             let [a2] = Patterns.match(Patterns.variable(),2);
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha,beta)    {
             let [a0] = Patterns.match(Patterns.variable(),1);
             let [a1,b0,c0] = Patterns.match(Kernel.SpecialForms.list(Patterns.variable(),Patterns.variable(),Patterns.variable()),Kernel.SpecialForms.list(a0,2,3));
             let _ref = Kernel.SpecialForms.list(a1,b0,c0);
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
     let test1 = Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(alpha__qmark__,beta__emark__)    {
             let [a__qmark__0] = Patterns.match(Patterns.variable(),1);
             let [b__emark__0] = Patterns.match(Patterns.variable(),2);
             return     b__emark__0;
           }));
    """

    assert_translation(ex_ast, js_code)
  end
  
end
