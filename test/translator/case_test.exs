defmodule ElixirScript.Translator.Case.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate case" do

    ex_ast = quote do
      case data do
        :ok -> value
        :error -> nil
      end
    end

    js_code = """
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Symbol.for('ok')],function()    {
             return     value;
           }),Elixir.Core.Patterns.clause([Symbol.for('error')],function()    {
             return     null;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        false -> value = 13
        true  -> true
      end
    end

    js_code = """
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([false],function()    {
             let [value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),13);
             return     value;
           }),Elixir.Core.Patterns.clause([true],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)



    ex_ast = quote do
      case data do
        false -> value = 13
        _  -> true
      end
    end

    js_code = """
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([false],function()    {
             let [value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),13);
             return     value;
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with guard" do
    ex_ast = quote do
      case data do
        number when number in [1,2,3,4] ->
          value = 13
        _  ->
          true
      end
    end

    js_code = """
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(number)    {
             let [value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),13);
             return     value;
           },function(number)    {
             return     Elixir.Core.Functions.contains(number,Object.freeze([1, 2, 3, 4]));
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with multiple guards" do
    ex_ast = quote do
      case data do
        number when number in [1,2,3,4] when number in [4, 3, 2, 1] ->
          value = 13
        _  ->
          true
      end
    end

    js_code = """
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.variable()],function(number)    {
             let [value] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),13);
             return     value;
           },function(number)    {
             return     Elixir.Core.Functions.contains(number,Object.freeze([1, 2, 3, 4])) || Elixir.Core.Functions.contains(number,Object.freeze([4, 3, 2, 1]));
           }),Elixir.Core.Patterns.clause([Elixir.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end  

  test "translate case with multiple statements in body" do
    ex_ast = quote do
      case data do
        :ok ->
          :console.info("info")
          Todo.add(data)
        :error ->
          nil
      end
    end

    js_code = """
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Symbol.for('ok')],function()    {
             console.info('info');
             return     Todo.add(data);
           }),Elixir.Core.Patterns.clause([Symbol.for('error')],function()    {
             return     null;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with destructing" do
    ex_ast = quote do
      case data do
        { one, two } ->
          :console.info(one)
        :error ->
          nil
      end
    end

    js_code = """
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
    })], function(one, two) {
        return console.info(one);
    }), Elixir.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with nested destructing" do
    ex_ast = quote do
      case data do
        { {one, two} , three } ->
          :console.info(one)
        :error ->
          nil
      end
    end

    js_code = """
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
            values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
        }), Elixir.Core.Patterns.variable()]
    })], function(one, two, three) {
        return console.info(one);
    }), Elixir.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      case data do
        { one, {two, three} } ->
          :console.info(one)
        :error ->
          nil
      end
    end

    js_code = """
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
            values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
        })]
    })], function(one, two, three) {
        return console.info(one);
    }), Elixir.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      case data do
        %AStruct{key: %BStruct{ key2: value }} ->
          :console.info(value)
        :error ->
          nil
      end
    end

    js_code = """
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(AStruct, {
        [Symbol.for('key')]: Elixir.Core.Patterns.type(BStruct, {
            [Symbol.for('key2')]: Elixir.Core.Patterns.variable()
        })
    })], function(value) {
        return console.info(value);
    }), Elixir.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      case data do
        %AStruct{key: %BStruct{ key2: value, key3: %CStruct{ key4: value2 } }} ->
          :console.info(value)
        :error ->
          nil
      end
    end

    js_code = """
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.clause([Elixir.Core.Patterns.type(AStruct, {
        [Symbol.for('key')]: Elixir.Core.Patterns.type(BStruct, {
            [Symbol.for('key2')]: Elixir.Core.Patterns.variable(), [Symbol.for('key3')]: Elixir.Core.Patterns.type(CStruct, {
                [Symbol.for('key4')]: Elixir.Core.Patterns.variable()
            })
        })
    })], function(value, value2) {
        return console.info(value);
    }), Elixir.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)
  end
end
