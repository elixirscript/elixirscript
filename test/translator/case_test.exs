defmodule ElixirScript.Translator.Case.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate case" do

    ex_ast = quote do
      case data do
        :ok -> value
        :error -> nil
      end
    end

    js_code = """
      funcy.fun([[Erlang.atom('ok')], function() {
        return value;
      }], [[Erlang.atom('error')], function() {
        return null;
      }]).call(data);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        false -> value = 13
        true  -> true
      end
    end

    js_code = """
      funcy.fun([[false], function() {
        let value0 = 13;
        return value0;
      }], [[true], function() {
        return true;
      }]).call(data);
    """

    assert_translation(ex_ast, js_code)



    ex_ast = quote do
      case data do
        false -> value = 13
        _  -> true
      end
    end

    js_code = """
      funcy.fun([[false], function() {
        let value0 = 13;
        return value0;
      }], [[funcy.wildcard], function() {
        return true;
      }]).call(data);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate case with guard" do
    ex_ast = quote do
      case data do
        number when number in [1,2,3,4] -> 
          value = 13
        _  -> 
          true
      end
    end

    js_code = """
      funcy.fun(
        [
          [funcy.parameter], 
          function(number) {
            let value0 = 13;
            return value0;
          }, 
          function(number) {
            return Kernel.__in__(number, Erlang.list(1, 2, 3, 4));
          }
        ], 
        [
          [funcy.wildcard], 
          function() {
            return true;
          }
        ]
      ).call(data);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate case with multiple statements in body" do
    ex_ast = quote do
      case data do
        :ok -> 
          Logger.info("info")
          Todo.add(data)
        :error -> 
          nil
      end
    end

    js_code = """
      funcy.fun([[Erlang.atom('ok')], function() {
        Logger.info('info');
        return Todo.add(data);
      }], [[Erlang.atom('error')], function() {
        return null;
      }]).call(data);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate case with destructing" do
    ex_ast = quote do
      case data do
        { one, two } -> 
          Logger.info(one)
        :error -> 
          nil
      end
    end

    js_code = """
      funcy.fun([[Erlang.tuple(funcy.parameter, funcy.parameter)], function(one, two) {
        return Logger.info(one);
      }], [[Erlang.atom('error')], function() {
        return null;
      }]).call(data);
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate case with nested destructing" do
    ex_ast = quote do
      case data do
        { {one, two} , three } -> 
          Logger.info(one)
        :error -> 
          nil
      end
    end

    js_code = """
      funcy.fun(
        [
          [Erlang.tuple(Erlang.tuple(funcy.parameter, funcy.parameter), funcy.parameter)], 
          function(one, two, three) {
            return Logger.info(one);
          }
        ], 
        [
          [Erlang.atom('error')], 
          function() {
            return null;
          }
        ]
      ).call(data);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        { one, {two, three} } -> 
          Logger.info(one)
        :error -> 
          nil
      end
    end

    js_code = """
      funcy.fun([[Erlang.tuple(funcy.parameter, Erlang.tuple(funcy.parameter, funcy.parameter))], function(one, two, three) {
        return Logger.info(one);
      }], [[Erlang.atom('error')], function() {
        return null;
      }]).call(data);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      case data do
        %AStruct{key: %BStruct{ key2: value }} -> 
          Logger.info(value)
        :error -> 
          nil
      end
    end

    js_code = """
      funcy.fun(
        [
          [{'__struct__': Erlang.atom('AStruct'), Erlang.atom('key'): {'__struct__': Erlang.atom('BStruct'), Erlang.atom('key2'): funcy.parameter}}], 
          function(value){
            return Logger.info(value);
          }
        ],
        [
          [Erlang.atom('error')], 
          function(){
            return null;
          }
        ]
      ).call(data);
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      case data do
        %AStruct{key: %BStruct{ key2: value, key3: %CStruct{ key4: value2 } }} -> 
          Logger.info(value)
        :error -> 
          nil
      end
    end

    js_code = """
    funcy.fun(
      [
        [{'__struct__': Erlang.atom('AStruct'), Erlang.atom('key'): {'__struct__': Erlang.atom('BStruct'), Erlang.atom('key2'): funcy.parameter, Erlang.atom('key3'): {'__struct__': Erlang.atom('CStruct'), Erlang.atom('key4'): funcy.parameter}}}], 
        function(value,value2){
          return Logger.info(value);
        }
      ],
      [
        [Erlang.atom('error')], 
        function(){
          return null;
        }
      ]
    ).call(data);
    """

    assert_translation(ex_ast, js_code)
  end
end