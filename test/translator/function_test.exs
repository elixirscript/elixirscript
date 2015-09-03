defmodule ElixirScript.Translator.Function.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate function with a macro" do
    ex_ast = quote do
      def test1() do
        ElixirScript.Math.squared(1)
      end
    end

    js_code = """
      let test1 = fun([[], function() {
        return 1 * 1;
      }]);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate functions" do
    ex_ast = quote do
      def test1() do
      end
    end

    js_code = """
      let test1 = fun([[], function() {
        return null;
      }]);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
      end
    end

    js_code = """
      let test1 = fun([[fun.parameter, fun.parameter], function(alpha, beta) {
        return null;
      }]);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        a = alpha
      end
    end

    js_code = """
     let test1 = fun([[fun.parameter, fun.parameter], function(alpha,beta)    {
             let [a0] = fun.bind(fun.parameter,alpha);
             return     a0;
           }]);
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
let test1 = fun([[fun.parameter, fun.parameter], function(alpha,beta)    {
             return     fun([[fun.parameter], function(x)    {
             return     2;
           }, function(x)    {
             return     Kernel.__in__(x,Erlang.list(false,null));
           }],[[fun.wildcard], function()    {
             return     1;
           }]).call(this, 1 == 1);
           }]);
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
let test1 = fun([[fun.parameter, fun.parameter], function(alpha,beta)    {
             return     fun([[fun.parameter], function(x)    {
             return     2;
           }, function(x)    {
             return     Kernel.__in__(x,Erlang.list(false,null));
           }],[[fun.wildcard], function()    {
             return     fun([[fun.parameter], function(x)    {
             let [a000] = fun.bind(fun.parameter,1);
             return     a000;
           }, function(x)    {
             return     Kernel.__in__(x,Erlang.list(false,null));
           }],[[fun.wildcard], function()    {
             return     4;
           }]).call(this,2 == 2);
           }]).call(this,1 == 1);
           }]);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        {a, b} = {1, 2}
      end
    end

    js_code = """
     let test1 = fun([[fun.parameter, fun.parameter], function(alpha,beta)    {
             let [a0,b0] = fun.bind(Erlang.tuple(fun.parameter,fun.parameter),Erlang.tuple(1,2));
             let _ref = Erlang.tuple(a0,b0);
             return     _ref;
           }]);
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

    js_code = "Kernel.JS.get_property_or_call_function(Taco, 'test1')"   

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

    js_code = "Enum.map(list,fun([[fun.parameter], function(x){return x * 2;}]))"

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
     const __MODULE__ = Erlang.atom('Example');

     let example = fun(
        [
          [], 
          function() {
            return null;
          }
        ],
        [
          [fun.parameter], function(oneArg) {
                return null;
           } 
        ],
        [
          [fun.parameter, fun.parameter], 
          function(oneArg, twoArg) {
            return null;
          } 
        ], 
        [
          [fun.parameter, fun.parameter, fun.parameter], 
          function(oneArg, twoArg, redArg) {
            return null;
          } 
        ],  
        [
          [fun.parameter, fun.parameter, fun.parameter, fun.parameter], 
          function(oneArg, twoArg, redArg, blueArg) {
            return null;
          } 
        ]
      );

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
     const __MODULE__ = Erlang.atom('Example');

     let example = fun(
        [
          [], 
          function() {
            return null;
          }
        ],
        [
          [fun.parameter], function(oneArg) {
                return null;
           } 
        ],
        [
          [fun.parameter, fun.parameter], 
          function(oneArg, twoArg) {
            return null;
          } 
        ], 
        [
          [fun.parameter, fun.parameter, fun.parameter], 
          function(oneArg, twoArg, redArg) {
            return null;
          } 
        ],  
        [
          [fun.parameter, fun.parameter, fun.parameter, fun.parameter], 
          function(oneArg, twoArg, redArg, blueArg) {
            return null;
          } 
        ]
      );

     export default { example: example };
    """  
    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      defmodule Example do
        def example(oneArg) do
        end
      end
    end 

    js_code = """
     const __MODULE__ = Erlang.atom('Example');
     let example = fun([[fun.parameter], function(oneArg){return null;}]);
     export default {example: example};
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

    js_code = "Kernel.is_atom(Erlang.atom('atom'))"

    assert_translation(ex_ast, js_code)
  end

  should "guards" do
    ex_ast = quote do
      def something(one) when is_number(one) do
      end
    end


    js_code = """
      let something = fun(
        [[fun.parameter], function(one){ return null; }, function(one){ return Kernel.is_number(one); } ]
      );
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      def something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
      let something = fun(
        [
          [fun.parameter], 
          function(one){ 
            return null; 
          }, 
          function(one){ 
            return Kernel.is_number(one) || Kernel.is_atom(one);
          } 
        ]
      );
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
      let something = fun(
        [
          [fun.parameter], 
          function(one){ 
            return null; 
          }, 
          function(one){ 
            return Kernel.is_number(one) || Kernel.is_atom(one);
          } 
        ]
      );
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one, two) when one in [1, 2, 3] do
      end
    end


    js_code = """
    let something = fun([
      [fun.parameter, fun.parameter], 
      function(one,two){
        return null;
      }, 
      function(one,two){
        return Kernel.__in__(one, Erlang.list(1,2,3));
      }
    ]);
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
    const __MODULE__ = Erlang.atom('Example');

    let something = fun(
    [
      [fun.parameter], 
      function(one) {
        return null;
      }, 
      function(one) {
        return Kernel.__in__(one, Erlang.list(1, 2, 3));
      }
    ], 
    [
      [fun.parameter], 
      function(one) {
        return null;
      }, 
      function(one) {
        return Kernel.is_number(one) || Kernel.is_atom(one);
      }
    ]);

    export default {
      something: something
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
      let something = fun(
        [
          [1], 
          function(){ 
            return null; 
          }
        ]
      );
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with list" do
    ex_ast = quote do
      def something([apple | fruits]) do
      end
    end


    js_code = """
      let something = fun(
        [
          [fun.headTail], 
          function(apple, fruits){ 
            return null; 
          }
        ]
      );
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with multiple items in list" do
    ex_ast = quote do
      def something([apple, pear, banana]) do
      end
    end


    js_code = """
      let something = fun([
        [Erlang.list(fun.parameter, fun.parameter, fun.parameter)], 
        function(apple, pear, banana) {
          return null;
        }
      ]);
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with tuple" do
    ex_ast = quote do
      def something({ apple , fruits }) do
      end
    end


    js_code = """
      let something = fun(
        [
          [Erlang.tuple(fun.parameter, fun.parameter)], 
          function(apple, fruits){ 
            return null; 
          }
        ]
      );
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct" do
    ex_ast = quote do
      def something(%AStruct{}) do
      end
    end


    js_code = """
      let something = fun([
        [{'__struct__': Erlang.atom('AStruct')}], 
        function(){
          return null;
        }
      ]);
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct reference" do
    ex_ast = quote do
      def something(%AStruct{} = a) do
      end
    end

    js_code = """
      let something = fun(
        [
          [fun.capture({'__struct__': Erlang.atom('AStruct')})], 
          function(a){ 
            return null; 
          }
        ]
      );
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct decontructed" do
    ex_ast = quote do
      def something(%AStruct{key: value, key1: 2}) do
      end
    end


    js_code = """
      let something = fun([
        [{'__struct__': Erlang.atom('AStruct'), 'key': fun.parameter, 'key1': 2}], 
        function(value){
          return null;
        }
      ]);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something(%AStruct{key: value, key1: 2}) when is_number(value) do
      end
    end


    js_code = """
     let something = fun(
      [
        [{'__struct__': Erlang.atom('AStruct'), 'key': fun.parameter, 'key1': 2}], 
        function(value){
          return null;
        }, 
        function(value){
          return Kernel.is_number(value);
        }
      ]);
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with binary part" do
    ex_ast = quote do
      def something("Bearer " <> token) do
      end
    end


    js_code = """
      let something = fun(
        [
          [fun.startsWith('Bearer')], 
          function(token){ 
            return null; 
          }
        ]
      );
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel) do
      end
    end


    js_code = """
      let something = fun(
        [
          [fun.startsWith('Bearer'), fun.parameter], 
          function(token, hotel){ 
            return null; 
          }
        ]
      );
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel, 1) do
      end
    end


    js_code = """
      let something = fun(
        [
          [fun.startsWith('Bearer'), fun.parameter, 1], 
          function(token, hotel){ 
            return null; 
          }
        ]
      );
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
    const __MODULE__ = Erlang.atom('Example');

    let something = fun([[1], function() {
      return null;
    }], [[2], function() {
      return null;
    }], [[fun.parameter], function(one) {
      return null;
    }, function(one) {
      return Kernel.is_binary(one);
    }], [[fun.parameter], function(one) {
      return null;
    }]);

    export default {
      something: something
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
     let test1 = fun([[fun.parameter, fun.parameter], function(alpha,beta)    {
             let [a0] = fun.bind(fun.parameter,1);
             let [a1] = fun.bind(fun.parameter,2);
             return     a1;
           }]);
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
     let test1 = fun([[fun.parameter, fun.parameter], function(alpha,beta)    {
             let [a0] = fun.bind(fun.parameter,1);
             let [a1] = fun.bind(fun.parameter,a0);
             let [a2] = fun.bind(fun.parameter,2);
             return     a2;
           }]);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def test1(alpha, beta) do
        a = 1
        [a, b, c] = [a, 2, 3]
      end
    end

    js_code = """
     let test1 = fun([[fun.parameter, fun.parameter], function(alpha,beta)    {
             let [a0] = fun.bind(fun.parameter,1);
             let [a1,b0,c0] = fun.bind(Erlang.list(fun.parameter,fun.parameter,fun.parameter),Erlang.list(a0,2,3));
             let _ref = Erlang.list(a1,b0,c0);
             return     _ref;
           }]);
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
     let test1 = fun([[fun.parameter, fun.parameter], function(alpha__qmark__,beta__emark__)    {
             let [a__qmark__0] = fun.bind(fun.parameter,1);
             let [b__emark__0] = fun.bind(fun.parameter,2);
             return     b__emark__0;
           }]);
    """

    assert_translation(ex_ast, js_code)
  end
  
end
