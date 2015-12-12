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
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('ok')],function()    {
             return     value;
           }),Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
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
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
             let [value0] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),13);
             return     value0;
           }),Elixir.Core.Patterns.make_case([true],function()    {
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
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([false],function()    {
             let [value0] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),13);
             return     value0;
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
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
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.variable()],function(number)    {
             let [value0] = Elixir.Core.Patterns.match(Elixir.Core.Patterns.variable(),13);
             return     value0;
           },function(number)    {
             return     Elixir$ElixirScript$Kernel.in(number,Elixir.Kernel.SpecialForms.list(1,2,3,4));
           }),Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
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
     Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('ok')],function()    {
             console.info('info');
             return     Todo.add(data);
           }),Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
             return     null;
           })).call(this,data)
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
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
    })], function(one, two) {
        return console.info(one);
    }), Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')], function() {
        return null;
    })).call(this, data)
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
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
            values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
        }), Elixir.Core.Patterns.variable()]
    })], function(one, two, three) {
        return console.info(one);
    }), Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')], function() {
        return null;
    })).call(this, data)
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
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
        values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.type(Elixir.Core.Tuple, {
            values: [Elixir.Core.Patterns.variable(), Elixir.Core.Patterns.variable()]
        })]
    })], function(one, two, three) {
        return console.info(one);
    }), Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')], function() {
        return null;
    })).call(this, data)
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
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(AStruct, {
        [Elixir.Kernel.SpecialForms.atom('key')]: Elixir.Core.Patterns.type(BStruct, {
            [Elixir.Kernel.SpecialForms.atom('key2')]: Elixir.Core.Patterns.variable()
        })
    })], function(value) {
        return console.info(value);
    }), Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')], function() {
        return null;
    })).call(this, data)
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
    Elixir.Core.Patterns.defmatch(Elixir.Core.Patterns.make_case([Elixir.Core.Patterns.type(AStruct, {
        [Elixir.Kernel.SpecialForms.atom('key')]: Elixir.Core.Patterns.type(BStruct, {
            [Elixir.Kernel.SpecialForms.atom('key2')]: Elixir.Core.Patterns.variable(), [Elixir.Kernel.SpecialForms.atom('key3')]: Elixir.Core.Patterns.type(CStruct, {
                [Elixir.Kernel.SpecialForms.atom('key4')]: Elixir.Core.Patterns.variable()
            })
        })
    })], function(value, value2) {
        return console.info(value);
    }), Elixir.Core.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)
  end
end
