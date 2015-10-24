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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('ok')],function()    {
             return     value;
           }),Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([false],function()    {
             let [value0] = Elixir.Patterns.match(Elixir.Patterns.variable(),13);
             return     value0;
           }),Elixir.Patterns.make_case([true],function()    {
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([false],function()    {
             let [value0] = Elixir.Patterns.match(Elixir.Patterns.variable(),13);
             return     value0;
           }),Elixir.Patterns.make_case([Elixir.Patterns.wildcard()],function()    {
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Patterns.variable()],function(number)    {
             let [value0] = Elixir.Patterns.match(Elixir.Patterns.variable(),13);
             return     value0;
           },function(number)    {
             return     Elixir.Kernel.in(number,Elixir.Kernel.SpecialForms.list(1,2,3,4));
           }),Elixir.Patterns.make_case([Elixir.Patterns.wildcard()],function()    {
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('ok')],function()    {
             console.info('info');
             return     Todo.add(data);
           }),Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.tuple(Elixir.Patterns.variable(),Elixir.Patterns.variable())],function(one,two)    {
             return     console.info(one);
           }),Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
             return     null;
           })).call(this,data)
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.tuple(Elixir.Kernel.SpecialForms.tuple(Elixir.Patterns.variable(),Elixir.Patterns.variable()),Elixir.Patterns.variable())],function(one,two,three)    {
             return     console.info(one);
           }),Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
             return     null;
           })).call(this,data)
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.tuple(Elixir.Patterns.variable(),Elixir.Kernel.SpecialForms.tuple(Elixir.Patterns.variable(),Elixir.Patterns.variable()))],function(one,two,three)    {
             return     console.info(one);
           }),Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
             return     null;
           })).call(this,data)

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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([{
             [Elixir.Kernel.SpecialForms.atom('__struct__')]: Elixir.Kernel.SpecialForms.atom('AStruct'),     [Elixir.Kernel.SpecialForms.atom('key')]: {
             [Elixir.Kernel.SpecialForms.atom('__struct__')]: Elixir.Kernel.SpecialForms.atom('BStruct'),     [Elixir.Kernel.SpecialForms.atom('key2')]: Elixir.Patterns.variable()
       }
       }],function(value)    {
             return     console.info(value);
           }),Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
             return     null;
           })).call(this,data)
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
     Elixir.Patterns.defmatch(Elixir.Patterns.make_case([{
             [Elixir.Kernel.SpecialForms.atom('__struct__')]: Elixir.Kernel.SpecialForms.atom('AStruct'),     [Elixir.Kernel.SpecialForms.atom('key')]: {
             [Elixir.Kernel.SpecialForms.atom('__struct__')]: Elixir.Kernel.SpecialForms.atom('BStruct'),     [Elixir.Kernel.SpecialForms.atom('key2')]: Elixir.Patterns.variable(),     [Elixir.Kernel.SpecialForms.atom('key3')]: {
             [Elixir.Kernel.SpecialForms.atom('__struct__')]: Elixir.Kernel.SpecialForms.atom('CStruct'),     [Elixir.Kernel.SpecialForms.atom('key4')]: Elixir.Patterns.variable()
       }
       }
       }],function(value,value2)    {
             return     console.info(value);
           }),Elixir.Patterns.make_case([Elixir.Kernel.SpecialForms.atom('error')],function()    {
             return     null;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end
end