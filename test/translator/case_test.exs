defmodule ElixirScript.Translator.Case.Test do
  use ExUnit.Case
  import ElixirScript.TestHelper

  test "translate case" do

    ex_ast = quote do
      def execute() do
        data = :ok
        case data do
          :ok -> 1
          :error -> nil
        end
      end
    end

    js_code = """
     Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Symbol.for('ok')],function()    {
             return     1;
           }),Bootstrap.Core.Patterns.clause([Symbol.for('error')],function()    {
             return     null;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      data = true
      case data do
        false -> value = 13
        true  -> true
      end
    end

    js_code = """
     Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([false],function()    {
             let [value] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),13);
             return     value;
           }),Bootstrap.Core.Patterns.clause([true],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)



    ex_ast = quote do
      data = :ok
      case data do
        false -> value = 13
        _  -> true
      end
    end

    js_code = """
     Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([false],function()    {
             let [value] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),13);
             return     value;
           }),Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with guard" do
    ex_ast = quote do
      data = :ok
      case data do
        number when number in [1,2,3,4] ->
          value = 13
        _  ->
          true
      end
    end

    js_code = """
     Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(number)    {
             let [value] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),13);
             return     value;
           },function(number)    {
           return     Elixir.ElixirScript.Bootstrap.Functions.__load(Elixir).contains(number,Object.freeze([1, 2, 3, 4]));
           }),Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with multiple guards" do
    ex_ast = quote do
      data = :ok
      case data do
        number when number in [1,2,3,4] when number in [4, 3, 2, 1] ->
          value = 13
        _  ->
          true
      end
    end

    js_code = """
     Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.variable()],function(number)    {
             let [value] = Bootstrap.Core.Patterns.match(Bootstrap.Core.Patterns.variable(),13);
             return     value;
           },function(number)    {
           return     Elixir.ElixirScript.Bootstrap.Functions.__load(Elixir).contains(number,Object.freeze([1, 2, 3, 4])) || Elixir.ElixirScript.Bootstrap.Functions.__load(Elixir).contains(number,Object.freeze([4, 3, 2, 1]));
           }),Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.wildcard()],function()    {
             return     true;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with multiple statements in body" do
    ex_ast = quote do
      def execute() do
        data = :ok
        case data do
          :ok ->
            :console.info("info")
            Todo.add(data)
          :error ->
            nil
        end
      end
    end

    js_code = """
     Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Symbol.for('ok')],function()    {
             console.info('info');
             return     Todo.add(data);
           }),Bootstrap.Core.Patterns.clause([Symbol.for('error')],function()    {
             return     null;
           })).call(this,data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with destructing" do
    ex_ast = quote do
      def execute() do
        data = :ok
        case data do
          { one, two } ->
            :console.info(one)
          :error ->
            nil
        end
      end
    end

    js_code = """
    Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
        values: [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()]
    })], function(one, two) {
        return console.info(one);
    }), Bootstrap.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)
  end

  test "translate case with nested destructing" do
    ex_ast = quote do
      def execute() do
        data = :error
        case data do
          { {one, two} , three } ->
            :console.info(one)
          :error ->
            nil
        end
      end
    end

    js_code = """
    Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
        values: [Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
            values: [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()]
        }), Bootstrap.Core.Patterns.variable()]
    })], function(one, two, three) {
        return console.info(one);
    }), Bootstrap.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      data = :error
      case data do
        { one, {two, three} } ->
          :console.info(one)
        :error ->
          nil
      end
    end

    js_code = """
    Bootstrap.Core.Patterns.defmatch(Bootstrap.Core.Patterns.clause([Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
        values: [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.type(Bootstrap.Core.Tuple, {
            values: [Bootstrap.Core.Patterns.variable(), Bootstrap.Core.Patterns.variable()]
        })]
    })], function(one, two, three) {
        return console.info(one);
    }), Bootstrap.Core.Patterns.clause([Symbol.for('error')], function() {
        return null;
    })).call(this, data)
    """

    assert_translation(ex_ast, js_code)
  end
end
