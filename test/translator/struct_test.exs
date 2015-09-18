defmodule ElixirScript.Translator.Struct.Test do
  use ShouldI
  import ElixirScript.TestHelper

  should "translate struct with default values" do
    ex_ast = quote do
      defmodule User do
        defstruct name: "john", age: 27
      end
    end

    js_code = """
     const __MODULE__ = Erlang.atom('User');
     function defstruct(name = 'john', age = 27) {
         return {
             [Erlang.atom('__struct__')]: __MODULE__,
             [Erlang.atom('name')]: name,
             [Erlang.atom('age')]: age
         };
     }
     export { defstruct };
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate struct without default values" do

    ex_ast = quote do
      defmodule User do
        defstruct :name, :age
      end
    end

    js_code = """
     const __MODULE__ = Erlang.atom('User');
     function defstruct(name, age) {
         return {
             [Erlang.atom('__struct__')]: __MODULE__,
             [Erlang.atom('name')]: name,
             [Erlang.atom('age')]: age
         };
     }
     export { defstruct };
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate struct creation" do
    ex_ast = quote do
      user = %User{}
    end

    js_code = """
      let [user] = Patterns.match(Patterns.variable(),User.defstruct());
    """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      user = %User{name: "John"}
    end

    js_code = """
     let [user] = Patterns.match(Patterns.variable(),User.defstruct(name = 'John'));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate struct update" do
    ex_ast = quote do
      user = %{ map | key: value }
    end

    js_code = """
     let [user] = Patterns.match(Patterns.variable(),(function()    {
             let _results = {};
             for(let prop in map)     {
             if(map.hasOwnProperty(prop))     {
             _results[prop] = map[prop];
           }
           }
             _results.key = value;
             return     _results;
           }.call(this)));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      user = %{ map | key: value, key1: value1 }
    end

    js_code = """
     let [user] = Patterns.match(Patterns.variable(),(function()    {
             let _results = {};
             for(let prop in map)     {
             if(map.hasOwnProperty(prop))     {
             _results[prop] = map[prop];
           }
           }
             _results.key = value;
             _results.key1 = value1;
             return     _results;
           }.call(this)));
    """

    assert_translation(ex_ast, js_code)
  end

  should "translate defexception" do
    ex_ast = quote do
      defmodule MyAppError do
        defexception message: "This is a message"
      end
    end

    js_code = """
     const __MODULE__ = Erlang.atom('MyAppError');
     function defexception(message = 'This is a message') {
         return {
             [Erlang.atom('__struct__')]: __MODULE__,
             [Erlang.atom('message')]: message
         };
     }
     export { defexception };
     """

    assert_translation(ex_ast, js_code)

    ex_ast = quote do
      defmodule MyAppError do
        defexception [:message]
      end
    end

    js_code = """
     const __MODULE__ = Erlang.atom('MyAppError');
     function defexception(message = null) {
         return {
             [Erlang.atom('__struct__')]: __MODULE__,
             [Erlang.atom('message')]: message
         };
     }
     export { defexception };
    """

    assert_translation(ex_ast, js_code)

  end

  should "translate raise exception" do
    ex_ast = quote do
      raise MyAppError, message: "did not get what was expected"
    end

    js_code = """
      throw new MyAppError(MyAppError.defexception(message='did not get what was expected'));
    """

    assert_translation(ex_ast, js_code)


    ex_ast = quote do
      raise "did not get what was expected"
    end

    js_code = """
      throw new RuntimeError({__struct__: Erlang.atom('RuntimeError'), message: 'did not get what was expected'});
    """

    assert_translation(ex_ast, js_code)

  end
end
