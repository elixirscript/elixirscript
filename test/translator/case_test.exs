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
      Patterns.defmatch({ pattern: [Kernel.SpecialForms.atom('ok')], fn: function() {
        return value;
      }}, [[Kernel.SpecialForms.atom('error')], function() {
        return null;
      }]).call(this, data)
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        false -> value = 13
        true  -> true
      end
    end

    js_code = """
      Patterns.defmatch([[false], function() {
        let [value0] = Patterns.match(Patterns.variable(),13);
        return value0;
      }], [[true], function() {
        return true;
      }]).call(this, data)
    """

    assert_translation(ex_ast, js_code)



    ex_ast = quote do
      case data do
        false -> value = 13
        _  -> true
      end
    end

    js_code = """
      Patterns.defmatch([[false], function() {
        let [value0] = Patterns.match(Patterns.variable(),13);
        return value0;
      }], [[Patterns.wildcard()], function() {
        return true;
      }]).call(this, data)
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
      Patterns.defmatch(
        [
          [Patterns.variable()], 
          function(number) {
            let [value0] = Patterns.match(Patterns.variable(),13);
            return value0;
          }, 
          function(number) {
            return Kernel.__in__(number, Kernel.SpecialForms.list(1, 2, 3, 4));
          }
        ], 
        [
          [Patterns.wildcard()], 
          function() {
            return true;
          }
        ]
      ).call(this, data)
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
      Patterns.defmatch([[Kernel.SpecialForms.atom('ok')], function() {
        console.info('info');
        return Todo.add(data);
      }], [[Kernel.SpecialForms.atom('error')], function() {
        return null;
      }]).call(this, data)
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
      Patterns.defmatch([[Kernel.SpecialForms.tuple(Patterns.variable(), Patterns.variable())], function(one, two) {
        return console.info(one);
      }], [[Kernel.SpecialForms.atom('error')], function() {
        return null;
      }]).call(this, data)
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
      Patterns.defmatch(
        [
          [Kernel.SpecialForms.tuple(Kernel.SpecialForms.tuple(Patterns.variable(), Patterns.variable()), Patterns.variable())], 
          function(one, two, three) {
            return console.info(one);
          }
        ], 
        [
          [Kernel.SpecialForms.atom('error')], 
          function() {
            return null;
          }
        ]
      ).call(this, data)
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
      Patterns.defmatch([[Kernel.SpecialForms.tuple(Patterns.variable(), Kernel.SpecialForms.tuple(Patterns.variable(), Patterns.variable()))], function(one, two, three) {
        return console.info(one);
      }], [[Kernel.SpecialForms.atom('error')], function() {
        return null;
      }]).call(this, data)
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
      Patterns.defmatch(
        [
          [{'__struct__': Kernel.SpecialForms.atom('AStruct'), 'key': {'__struct__': Kernel.SpecialForms.atom('BStruct'), 'key2': Patterns.variable()}}], 
          function(value){
            return console.info(value);
          }
        ],
        [
          [Kernel.SpecialForms.atom('error')], 
          function(){
            return null;
          }
        ]
      ).call(this, data)
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
    Patterns.defmatch(
      [
        [{'__struct__': Kernel.SpecialForms.atom('AStruct'), 'key': {'__struct__': Kernel.SpecialForms.atom('BStruct'), 'key2': Patterns.variable(), 'key3': {'__struct__': Kernel.SpecialForms.atom('CStruct'), 'key4': Patterns.variable()}}}], 
        function(value,value2){
          return console.info(value);
        }
      ],
      [
        [Kernel.SpecialForms.atom('error')], 
        function(){
          return null;
        }
      ]
    ).call(this, data)
    """

    assert_translation(ex_ast, js_code)
  end
end