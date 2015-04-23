defmodule ElixirScript.Translator.Function.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate functions" do
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
        return (function(){
          if(1 == 1){
            return 1;
          }else{
            return 2;
          }
        }());;
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
        return (function(){
          if(1 == 1){
            return (function(){
              if(2 == 2){
                return 4;
              }else{
                let a = 1;
                return a;
              }
            }());;
          }else{
            return 2;
          }
        }());;
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
        {
          let _ref = Tuple(1, 2);
          let [a, b] = _ref.value;
          return [a, b];
        }
      }
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
      test1(3, 2)
    end

    js_code = "test1(3,2)"

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      Taco.test1()
    end

    js_code = "ElixirScript.get_property_or_call_function(Taco, 'test1')"   

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

    js_code = "Enum.map(list, function(x){ return x * 2; })"

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
      const __MODULE__ = [Atom('Example')];

      function example__0(){ return null; throw new FunctionClauseError('no function clause matching in example/0'); }
      function example__1(oneArg){ return null; throw new FunctionClauseError('no function clause matching in example/1'); }
      function example__2(oneArg, twoArg){ return null; throw new FunctionClauseError('no function clause matching in example/2'); }
      function example__3(oneArg, twoArg, redArg){ return null; throw new FunctionClauseError('no function clause matching in example/3'); }
      function example__4(oneArg, twoArg, redArg, blueArg){ return null; throw new FunctionClauseError('no function clause matching in example/4'); }

      function example(...args){
        switch(args.length){
          case 0:
           return example__0.apply(null,args.slice(0,0-1));
          case 1:
            return example__1.apply(null,args.slice(0,1-1));
          case 2:
            return example__2.apply(null,args.slice(0,2-1));
          case 3:
            return example__3.apply(null,args.slice(0,3-1));
          case 4:
            return example__4.apply(null,args);
          default:
            throw new RuntimeError('undefined function:example/' + args.length);
            break;
        }
      }
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
      const __MODULE__ = [Atom('Example')];

      function example__0(){ return null; throw new FunctionClauseError('no function clause matching in example/0'); }
      function example__1(oneArg){ return null; throw new FunctionClauseError('no function clause matching in example/1'); }
      function example__2(oneArg, twoArg){ return null; throw new FunctionClauseError('no function clause matching in example/2'); }
      function example__3(oneArg, twoArg, redArg){ return null; throw new FunctionClauseError('no function clause matching in example/3'); }
      function example__4(oneArg, twoArg, redArg, blueArg){ return null; throw new FunctionClauseError('no function clause matching in example/4'); }

      export function example(...args){
        switch(args.length){
          case 0:
           return example__0.apply(null,args.slice(0,0-1));
          case 1:
            return example__1.apply(null,args.slice(0,1-1));
          case 2:
            return example__2.apply(null,args.slice(0,2-1));
          case 3:
            return example__3.apply(null,args.slice(0,3-1));
          case 4:
            return example__4.apply(null,args);
          default:
            throw new RuntimeError('undefined function:example/' + args.length);
            break;
        }
      }
    """  
    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      defmodule Example do
        def example(oneArg) do
        end
      end
    end 

    js_code = """
      const __MODULE__ = [Atom('Example')];

      export function example(oneArg){
        return null;
      }
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

    js_code = "Kernel.is_atom(Atom('atom'))"

    assert_translation(ex_ast, js_code)
  end

  should "guards" do
    ex_ast = quote do
      def something(one) when is_number(one) do
      end
    end


    js_code = """
      export function something(one){
        if(Kernel.is_number(one)){
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      def something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
      export function something(one){
        if(Kernel.or(Kernel.is_number(one), Kernel.is_atom(one))){
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one) when is_number(one) or is_atom(one) do
      end
    end


    js_code = """
      function something(one){
        if(Kernel.or(Kernel.is_number(one), Kernel.is_atom(one))){
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defp something(one, two) when one in [1, 2, 3] do
      end
    end


    js_code = """
      function something(one, two){
        if(Kernel._in(one, [1,2,3])){
          return null;
        }
      }
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
      const __MODULE__ = [Atom('Example')];

      function something__1(one){
        if(Kernel._in(one,[1,2,3])){
          return null;
        }

        if(Kernel.or(Kernel.is_number(one), Kernel.is_atom(one))){
          return null;
        }

        throw new FunctionClauseError('no function clause matching in something/1');
      }

      export function something(...args){
        switch(args.length){
          case 1:
            return something__1.apply(null,args.slice(0,1-1));
          default:
            throw new RuntimeError('undefined function:something/' + args.length);
            break;
        }
      }
    """  
    assert_translation(ex_ast, js_code)

  end

  should "pattern match function with literal" do
    ex_ast = quote do
      def something(1) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(Kernel.match(1, arguments[0])){
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with list" do
    ex_ast = quote do
      def something([apple | fruits]) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(Kernel.is_list(arguments[0])){
          let apple = Kernel.hd(arguments[0]);
          let fruits = Kernel.tl(arguments[0]);
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with multiple items in list" do
    ex_ast = quote do
      def something([apple, pear, banana]) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(Kernel.is_list(arguments[0])){
          let apple = arguments[0][0];
          let pear = arguments[0][1];
          let banana = arguments[0][2];
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with tuple" do
    ex_ast = quote do
      def something({ apple , fruits }) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(Kernel.is_tuple(arguments[0])){
          let apple = arguments[0][0];
          let fruits = arguments[0][1];
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct" do
    ex_ast = quote do
      def something(%AStruct{}) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(Kernel.match({'__struct__': [Atom('AStruct')]}, arguments[0])){
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct reference" do
    ex_ast = quote do
      def something(%AStruct{} = a) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(Kernel.match({'__struct__': [Atom('AStruct')]}, arguments[0])){
          let a = arguments[0];
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with struct decontructed" do
    ex_ast = quote do
      def something(%AStruct{key: value, key1: 2}) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(Kernel.match({'__struct__': [Atom('AStruct')], 'key': undefined, 'key1': 2}, arguments[0])){
          let value = arguments[0]['key'];
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)
  end

  should "pattern match function with binary part" do
    ex_ast = quote do
      def something("Bearer " <> token) do
      end
    end


    js_code = """
      export function something(_ref0){
        if(arguments[0].startsWith('Bearer ')){
          let token = arguments[0].slice('Bearer '.length-1);
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel) do
      end
    end


    js_code = """
      export function something(_ref0, hotel){
        if(arguments[0].startsWith('Bearer ')){
          let token = arguments[0].slice('Bearer '.length-1);
          return null;
        }
      }
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      def something("Bearer " <> token, hotel, 1) do
      end
    end


    js_code = """
      export function something(_ref0, hotel, _ref2){
        if(Kernel.match(1, arguments[2])){
          if(arguments[0].startsWith('Bearer ')){
            let token = arguments[0].slice('Bearer '.length-1);
            return null; 
          }           
        }
      }
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
      const __MODULE__ = [Atom('Example')];

      function something__1(one){
        if(Kernel.match(1, arguments[0])){
          return null;
        }

        if(Kernel.match(2, arguments[0])){
          return null;
        }

        if(Kernel.is_binary(one)){
          return null;
        }

        return null;

        throw new FunctionClauseError('no function clause matching in something/1');
      }

      export function something(...args){
        switch(args.length){
          case 1:
            return something__1.apply(null,args.slice(0,1-1));
          default:
            throw new RuntimeError('undefined function:something/' + args.length);
            break;
        }
      }
    """
    
    assert_translation(ex_ast, js_code)

  end

  should "combine pattern matched struct functions" do
    ex_ast = quote do
      defmodule Example do
        def something(%AStruct{} = a) do
        end

        def something(%BStruct{} = b) do
        end

        def something(%CStruct{key: value, key1: 2}) do
        end
      end
    end


    js_code = """
     const __MODULE__ = [Atom('Example')];

     function something__1(_ref0) {
         if (Kernel.match({ '__struct__': [Atom('AStruct')] }, arguments[0])) {
             let a = arguments[0];
             return null;
         }

         if (Kernel.match({ '__struct__': [Atom('BStruct')] }, arguments[0])) {
             let b = arguments[0];
             return null;
         }

         if (Kernel.match({
                 '__struct__': [Atom('CStruct')],
                 'key': undefined,
                 'key1': 2
             }, arguments[0])) {
             let value = arguments[0]['key'];
             return null;
         }

         throw new FunctionClauseError('no function clause matching in something/1');
     }

     export function something(...args) {
         switch (args.length) {
         case 1:
             return something__1.apply(null, args.slice(0, 1 - 1));
         default:
             throw new RuntimeError('undefined function: something/' + args.length);
             break;
         }
     }
    """
    
    assert_translation(ex_ast, js_code)
  end

  
end