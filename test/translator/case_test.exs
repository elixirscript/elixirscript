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
      (function(){
        if(Kernel.match(Atom('ok'), data)){
          return value;
        }else if(Kernel.match(Atom('error'), data)){
          return null;
        }
      }());
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
        if(Kernel.match(false, data)){
          let value = 13;
          return value;
        }else if(Kernel.match(true, data)){
          return true;
        }
      }());    
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
        if(Kernel.match(false, data)){
          let value = 13;
          return value;
        }else{
          return true;
        }
      }());      
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
      (function(){
        if(Kernel._in(number, [1, 2, 3, 4])){
          let value = 13;
          return value;
        }else{
          return true;
        }
      }());
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
        if(Kernel.match(Atom('ok'), data)){
          Logger.info('info');
          return Todo.add(data);
        }else if(Kernel.match(Atom('error'), data)){
          return null;
        }
      }());
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
      (function(){
        if(Kernel.is_tuple(data)){
          let one = data[0];
          let two = data[1];
          return Logger.info(one);
        }else if(Kernel.match(Atom('error'), data)){
          return null;
        }
      }());
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
      (function(){
        if(Kernel.is_tuple(data)){
          let three = data[1];

          if(Kernel.is_tuple(data[0])){
            let one = data[0][0];
            let two = data[0][1];
            
            return Logger.info(one);
          }
        }else if(Kernel.match(Atom('error'), data)){
          return null;
        }
      }());
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
      (function(){
        if(Kernel.is_tuple(data)){
          let one = data[0];

          if(Kernel.is_tuple(data[1])){
            let two = data[1][0];
            let three = data[1][1];

            return Logger.info(one);
          }

        }else if(Kernel.match(Atom('error'), data)){
          return null;
        }
      }());
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
         if (Kernel.match({ 
              '__struct__': [Atom('AStruct')], 
              'key': { 
                '__struct__': [Atom('BStruct')], 
                'key2': undefined 
              } 
            }, data)) {
              let value = data['key']['key2'];
              return Logger.info(value);
         } else if (Kernel.match(Atom('error'), data)) {
             return null;
         }
     }());
    """

    assert_translation(ex_ast, js_code)
  end
end