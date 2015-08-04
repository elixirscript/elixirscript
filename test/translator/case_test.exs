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
      funcy.fun(
        [
          [Erlang.atom('ok')],
          function(){
            return value;
          }
        ],
        [
          [Erlang.atom('error')],
          function(){
            return nil;
          }
        ]
      ).call(data);
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        false -> value = 13
        true  -> true
      end
    end

    js_code = """
      (function(){
        if(Kernel.match__qmark__(false, data)){
          let value = 13;
          return value;
        }else if(Kernel.match__qmark__(true, data)){
          return true;
        }
      }.call(this));    
    """

    assert_translation(ex_ast, js_code)



    ex_ast = quote do
      case data do
        false -> value = 13
        _  -> true
      end
    end

    js_code = """
      (function(){
        if(Kernel.match__qmark__(false, data)){
          let value = 13;
          return value;
        }else{
          return true;
        }
      }.call(this));      
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
          function(number){
            let value = 13;
            return value;
          },
          function(number){
            return Kernel.__in__(number, Erlang.list(1, 2, 3, 4));
          }
        ],
        [
          [funcy.wildcard],
          function(){
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
      (function(){
        if(Kernel.match__qmark__(Erlang.atom('ok'), data)){
          Logger.info('info');
          return Todo.add(data);
        }else if(Kernel.match__qmark__(Erlang.atom('error'), data)){
          return null;
        }
      }.call(this));
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
     (function () {
         if (Kernel.is_tuple(data)) {
             let one = Kernel.elem(data, 0);
             let two = Kernel.elem(data, 1);
             return Logger.info(one);
         } else if (Kernel.match__qmark__(Erlang.atom('error'), data)) {
             return null;
         }
     }.call(this));
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
     (function () {
         if (Kernel.is_tuple(data)) {
             let three = Kernel.elem(data, 1);
             if (Kernel.is_tuple(Kernel.elem(data, 0))) {
                 let one = Kernel.elem(Kernel.elem(data, 0), 0);
                 let two = Kernel.elem(Kernel.elem(data, 0), 1);
                 return Logger.info(one);
             }
         } else if (Kernel.match__qmark__(Erlang.atom('error'), data)) {
             return null;
         }
     }.call(this));
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
     (function () {
         if (Kernel.is_tuple(data)) {
             let one = Kernel.elem(data, 0);
             if (Kernel.is_tuple(Kernel.elem(data, 1))) {
                 let two = Kernel.elem(Kernel.elem(data, 1), 0);
                 let three = Kernel.elem(Kernel.elem(data, 1), 1);
                 return Logger.info(one);
             }
         } else if (Kernel.match__qmark__(Erlang.atom('error'), data)) {
             return null;
         }
     }.call(this));
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
     (function () {
         if (Kernel.match__qmark__({ 
              '__struct__': Erlang.list(Erlang.atom('AStruct')), 
              'key': { 
                '__struct__': Erlang.list(Erlang.atom('BStruct')), 
                'key2': undefined 
              } 
            }, data)) {
              let value = data['key']['key2'];
              return Logger.info(value);
         } else if (Kernel.match__qmark__(Erlang.atom('error'), data)) {
             return null;
         }
     }.call(this));
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
     (function () {
         if (Kernel.match__qmark__({ 
              '__struct__': Erlang.list(Erlang.atom('AStruct')), 
              'key': { 
                '__struct__': Erlang.list(Erlang.atom('BStruct')), 
                'key2': undefined,
                'key3': {
                  '__struct__': Erlang.list(Erlang.atom('CStruct')),
                  'key4': undefined
                }
              } 
            }, data)) {
              let value = data['key']['key2'];
              let value2 = data['key']['key3']['key4'];
              return Logger.info(value);
         } else if (Kernel.match__qmark__(Erlang.atom('error'), data)) {
             return null;
         }
     }.call(this));
    """

    assert_translation(ex_ast, js_code)
  end
end